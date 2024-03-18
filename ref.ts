import {
	ActionFn,
	Context,
	Event,
	BlockEvent,
	Network
} from '@tenderly/actions';

import axios from 'axios';
import { ethers } from 'ethers';

import * as MocaTokenAbi from './MocaTokenAbi.json';
import * as MocaOftAbi from './MocaOftAbi.json';


export const trackSupply: ActionFn = async (context: Context, event: Event) => {
	let blockEvent = event as BlockEvent;
	console.log(blockEvent);

	const gatewaySepoliaURL = context.gateways.getGateway(Network.SEPOLIA);
	const gatewayMumbaiURL = context.gateways.getGateway(Network.MUMBAI);
  	
	// Using the Ethers.js provider class to call the RPC URL
  	const rpcSepolia = new ethers.JsonRpcProvider(gatewaySepoliaURL);
  	const rpcMumbai = new ethers.JsonRpcProvider(gatewayMumbaiURL);

	// Instantiate MocaToken contract
	const mocaTokenContractAddress = '0xa2e400ce40c83270d8369ec971d0fc2e46d5056a'; 
	const mocaTokenContract = new ethers.Contract(mocaTokenContractAddress, MocaTokenAbi, rpcSepolia);

	// Instantiate MocaOFT contract
	const mocaOftAddress = '0xaa7a95e597a65eb06dae4ed54f1b62e0535d9156'; 
	const mocaOftContract = new ethers.Contract(mocaOftAddress, MocaOftAbi, rpcMumbai);

	// Call balanceOf function
	const mocaTokenAdapterAddress = '0x5a9962874aca3b407aceb14f64c7ef2c6255c880'; 
	const adapterBalance = await mocaTokenContract.balanceOf(mocaTokenAdapterAddress);
	console.log('Adapter Balance:', adapterBalance.toString());

	// Call totalSupply on OFT
	const oftBalance = await mocaOftContract.totalSupply();
	console.log('OFT Balance:', oftBalance.toString());
	
	if(adapterBalance != oftBalance) {
		
		// alert: discord
		// await notifyDiscord(`${adapterBalance} ↔ ${oftBalance}`, context);

		const delta = BigInt(adapterBalance.toString()) - BigInt(oftBalance.toString());
		const deltaTokens = parseFloat(delta.toString()) / 1e18; 

		//send tg msg
		const message = 
			`Adapter Balance: ${adapterBalance}\n +
			 OFT Balance: ${oftBalance}\n +
			 Delta: ${delta}\n +
			 DeltaTokens: ${deltaTokens}\n`;

		await notifyTelegram(message, context);

		// trigger sendTransaction function
		const hash = sendTransaction(context);
		console.log('Polygon txn hash:', hash.toString());

		await notifyTelegram('Bridge broken on poylgon. Polygon txn hash: ${hash}', context);
	} 
}

async function sendTransaction(context: Context) {

	// Obtain the private key from context.secrets.get("oracle.addressPrivateKey")
	const rpcMumbai = new ethers.JsonRpcProvider('https://polygon-mumbai.g.alchemy.com/v2/MO6E3x0yRXX6j9Y-ufI00NcBL8P-SDOT');
	const privateKey = await context.secrets.get("monitor.privateKey");
	const signer = new ethers.Wallet(privateKey, rpcMumbai);

	// Instantiate MocaOFT contract
	const mocaOftAddress = '0xaa7a95e597a65eb06dae4ed54f1b62e0535d9156'; 
	const mocaOftContract = new ethers.Contract(mocaOftAddress, MocaOftAbi, signer);

	// break bridge from polygon side: polgyon cheaper
	const homeChainID = 40161;		// sepolia chainId
	let value = ethers.encodeBytes32String("")

	const txn = await mocaOftContract.setPeer(homeChainID, value);	
	console.log('Transaction created');

	// wait for block
	const receipt = await txn.wait(1);
	console.log('Transaction receipt:', receipt);

	return receipt.hash;
}


const notifyTelegram = async (text: string, context: Context) => {

    console.log('Sending to Telegram:', text);

	const botToken = await context.secrets.get("MocaMonitorBotToken");
    const chatId = await context.secrets.get("telegram.channelId");

    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        await axios.post(apiUrl, {
            chat_id: chatId,
            text: text,
        });
        console.log('Message sent successfully to Telegram');

    } catch (error) {

        console.error('Error sending message to Telegram:', error);
    }
};


/*
import * as TelegramBot from 'node-telegram-bot-api';

// works as well
const sendTgMessage = async (message: string, context: Context) => {

	try {
		
		const botToken = await context.secrets.get("MocaMonitorBotToken");

		const bot = new TelegramBot(botToken);
	  	await bot.sendMessage(-1002126569884, message);
	  	console.log('Message sent to Telegram channel successfully!');

	} catch (error) {

		console.error('Error sending message to Telegram:', error);
	}
};

const notifyDiscord = async (text: string, context: Context) => {

	console.log('Sending to Discord:', `🐥 ${text}`)

	const webhookLink = await context.secrets.get("discord.uniswapChannelWebhook");
	await axios.post(
		webhookLink,
		{
			'content': `🐥 ${text}`
		},
		{
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		}
	);
}

*/