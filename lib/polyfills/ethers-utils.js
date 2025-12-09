// Polyfill for ethers/lib/utils compatibility with ethers v6
// This file re-exports utilities from ethers v6 that thirdweb expects from ethers/lib/utils

import * as ethers from 'ethers';

// Re-export common utilities that thirdweb might need
export const formatUnits = ethers.formatUnits;
export const parseUnits = ethers.parseUnits;
export const formatEther = ethers.formatEther;
export const parseEther = ethers.parseEther;
export const getAddress = ethers.getAddress;
export const isAddress = ethers.isAddress;
export const getContractAddress = ethers.getContractAddress;
export const getCreateAddress = ethers.getCreateAddress;
export const getCreate2Address = ethers.getCreate2Address;
export const solidityPackedKeccak256 = ethers.solidityPackedKeccak256;
export const solidityPackedSha256 = ethers.solidityPackedSha256;
export const solidityPacked = ethers.solidityPacked;
export const id = ethers.id;
export const namehash = ethers.namehash;
export const dnsEncode = ethers.dnsEncode;
export const isValidName = ethers.isValidName;
export const AbiCoder = ethers.AbiCoder;
export const defaultAbiCoder = ethers.AbiCoder.defaultAbiCoder;
export const Interface = ethers.Interface;
export const Fragment = ethers.Fragment;
export const FunctionFragment = ethers.FunctionFragment;
export const EventFragment = ethers.EventFragment;
export const ParamType = ethers.ParamType;
export const ErrorFragment = ethers.ErrorFragment;
export const JsonRpcProvider = ethers.JsonRpcProvider;
export const WebSocketProvider = ethers.WebSocketProvider;
export const Wallet = ethers.Wallet;
export const VoidSigner = ethers.VoidSigner;
export const Contract = ethers.Contract;
export const ContractFactory = ethers.ContractFactory;
export const BigNumber = ethers.BigNumberish;
export const utils = {
  formatUnits: ethers.formatUnits,
  parseUnits: ethers.parseUnits,
  formatEther: ethers.formatEther,
  parseEther: ethers.parseEther,
  getAddress: ethers.getAddress,
  isAddress: ethers.isAddress,
  getContractAddress: ethers.getContractAddress,
  getCreateAddress: ethers.getCreateAddress,
  getCreate2Address: ethers.getCreate2Address,
  solidityPackedKeccak256: ethers.solidityPackedKeccak256,
  solidityPackedSha256: ethers.solidityPackedSha256,
  solidityPacked: ethers.solidityPacked,
  id: ethers.id,
  namehash: ethers.namehash,
  dnsEncode: ethers.dnsEncode,
  isValidName: ethers.isValidName,
  AbiCoder: ethers.AbiCoder,
  defaultAbiCoder: ethers.AbiCoder.defaultAbiCoder,
  Interface: ethers.Interface,
  Fragment: ethers.Fragment,
  FunctionFragment: ethers.FunctionFragment,
  EventFragment: ethers.EventFragment,
  ParamType: ethers.ParamType,
  ErrorFragment: ethers.ErrorFragment,
};

export default utils;

