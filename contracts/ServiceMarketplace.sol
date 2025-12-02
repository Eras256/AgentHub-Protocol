// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ServiceMarketplace
 * @dev Marketplace for AI agent services with x402 payment integration
 */
contract ServiceMarketplace is Ownable, ReentrancyGuard {
    IERC20 public usdc;

    struct Service {
        bytes32 serviceId;
        address provider;
        string name;
        string description;
        string endpointURL;
        uint256 pricePerRequest; // in USDC (18 decimals)
        uint256 totalRequests;
        uint256 rating; // 0-10000 basis points
        uint256 ratingCount;
        bool isActive;
        uint256 createdAt;
    }

    struct ServiceRequest {
        bytes32 requestId;
        bytes32 serviceId;
        address consumer;
        uint256 amount;
        uint256 timestamp;
        bool completed;
        uint8 rating; // 1-5 stars
    }

    mapping(bytes32 => Service) public services;
    mapping(bytes32 => ServiceRequest) public requests;
    mapping(address => bytes32[]) public providerServices;
    mapping(address => bytes32[]) public consumerRequests;

    bytes32[] public allServiceIds;
    uint256 public totalServices;

    event ServicePublished(
        bytes32 indexed serviceId,
        address indexed provider,
        string name,
        uint256 pricePerRequest
    );

    event ServiceRequested(
        bytes32 indexed requestId,
        bytes32 indexed serviceId,
        address indexed consumer,
        uint256 amount
    );

    event ServiceCompleted(
        bytes32 indexed requestId,
        uint8 rating
    );

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Publish new service to marketplace
     */
    function publishService(
        string calldata _name,
        string calldata _description,
        string calldata _endpointURL,
        uint256 _pricePerRequest
    ) external returns (bytes32) {
        bytes32 serviceId = keccak256(abi.encodePacked(
            msg.sender,
            _name,
            block.timestamp
        ));

        require(services[serviceId].provider == address(0), "Service already exists");
        require(_pricePerRequest > 0, "Price must be positive");

        services[serviceId] = Service({
            serviceId: serviceId,
            provider: msg.sender,
            name: _name,
            description: _description,
            endpointURL: _endpointURL,
            pricePerRequest: _pricePerRequest,
            totalRequests: 0,
            rating: 0,
            ratingCount: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        providerServices[msg.sender].push(serviceId);
        allServiceIds.push(serviceId);
        totalServices++;

        emit ServicePublished(serviceId, msg.sender, _name, _pricePerRequest);

        return serviceId;
    }

    /**
     * @dev Request service (payment via x402 handled off-chain)
     */
    function requestService(
        bytes32 _serviceId
    ) external nonReentrant returns (bytes32) {
        Service storage service = services[_serviceId];
        require(service.isActive, "Service not active");

        bytes32 requestId = keccak256(abi.encodePacked(
            _serviceId,
            msg.sender,
            block.timestamp
        ));

        // Transfer USDC payment
        require(
            usdc.transferFrom(msg.sender, service.provider, service.pricePerRequest),
            "Payment failed"
        );

        requests[requestId] = ServiceRequest({
            requestId: requestId,
            serviceId: _serviceId,
            consumer: msg.sender,
            amount: service.pricePerRequest,
            timestamp: block.timestamp,
            completed: false,
            rating: 0
        });

        service.totalRequests++;
        consumerRequests[msg.sender].push(requestId);

        emit ServiceRequested(requestId, _serviceId, msg.sender, service.pricePerRequest);

        return requestId;
    }

    /**
     * @dev Complete service request and rate
     */
    function completeServiceRequest(
        bytes32 _requestId,
        uint8 _rating
    ) external {
        ServiceRequest storage request = requests[_requestId];
        require(request.consumer == msg.sender, "Not request owner");
        require(!request.completed, "Already completed");
        require(_rating >= 1 && _rating <= 5, "Invalid rating");

        request.completed = true;
        request.rating = _rating;

        // Update service rating
        Service storage service = services[request.serviceId];
        uint256 totalRating = (service.rating * service.ratingCount) + (_rating * 2000); // Convert to basis points
        service.ratingCount++;
        service.rating = totalRating / service.ratingCount;

        emit ServiceCompleted(_requestId, _rating);
    }

    /**
     * @dev Get all services
     */
    function getAllServices() external view returns (Service[] memory) {
        Service[] memory allServices = new Service[](allServiceIds.length);
        for (uint256 i = 0; i < allServiceIds.length; i++) {
            allServices[i] = services[allServiceIds[i]];
        }
        return allServices;
    }

    /**
     * @dev Get services by provider
     */
    function getProviderServices(address _provider) external view returns (Service[] memory) {
        bytes32[] memory serviceIds = providerServices[_provider];
        Service[] memory provServices = new Service[](serviceIds.length);
        for (uint256 i = 0; i < serviceIds.length; i++) {
            provServices[i] = services[serviceIds[i]];
        }
        return provServices;
    }
}

