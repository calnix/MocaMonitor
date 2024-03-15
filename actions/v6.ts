import {
	ActionFn,
	Context,
	Event,
	BlockEvent,
} from '@tenderly/actions';


import { ethers } from 'ethers';
const { Network } = require('@tenderly/actions');

import * as MocaTokenAbi from './MocaTokenAbi.json';
import * as MocaOftAbi from './MocaOftAbi.json';


export const trackSupply: ActionFn = async (context: Context, event: Event) => {
	let blockEvent = event as BlockEvent;
	console.log(blockEvent);

	const gatewaySepolia = context.gateways.getGateway(Network.SEPOLIA);
	const gatewayMumbai = context.gateways.getGateway(Network.MUMBAI);
  	
	// Using the Ethers.js provider class to call the RPC URL
  	const rpcSepolia = new ethers.JsonRpcProvider(gatewaySepolia);
  	const rpcMumbai = new ethers.JsonRpcProvider(gatewayMumbai);

	// Instantiate MocaToken contract
	const mocaTokenContractAddress = '0xa2e400ce40c83270d8369ec971d0fc2e46d5056a'; 
	const mocaTokenContract = new ethers.Contract(
		mocaTokenContractAddress,
		MocaTokenAbi, // Use the ABI of the MocaToken contract
		rpcSepolia
	);

	// Call balanceOf function
	const mocaTokenAdapterAddress = '0x5a9962874aca3b407aceb14f64c7ef2c6255c880'; // Replace with the address you want to check the balance of
	const adapterBalance = await mocaTokenContract.balanceOf(mocaTokenAdapterAddress);
	console.log('Adapter Balance:', adapterBalance.toString());


	// Instantiate MocaOFT contract
	const mocaOftAddress = '0xaa7a95e597a65eb06dae4ed54f1b62e0535d9156'; 
	const mocaOftContract = new ethers.Contract(
		mocaOftAddress,
		MocaOftAbi, // Use the ABI of the MocaToken contract
		rpcMumbai
	);

	// Call totalSupply on OFT
	const oftBalance = await mocaOftContract.totalSupply();
	console.log('OFT Balance:', oftBalance.toString());

/*
	const mV = rpcSepolia.mocaToken.balanceOf('0x....')	
	const pV = rpcMumbai.mocaOft.totalSupply();
 
  	// Logging the block number of the latest mined block
  	console.log(await mV);
	console.log('.....');
	console.log(await pV);
*/
	if(adapterBalance != oftBalance) {
		
		sendSlackAlert()
	} 
}

function sendSlackAlert() {
	// send alert
}
