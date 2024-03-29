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

	const gatewaySepolia = context.gateways.getGateway(Network.SEPOLIA);
	const gatewayMumbai = context.gateways.getGateway(Network.MUMBAI);
  	
	// Using the Ethers.js provider class to call the RPC URL
  	const rpcSepolia = new ethers.JsonRpcProvider(gatewaySepolia);
  	const rpcMumbai = new ethers.JsonRpcProvider(gatewayMumbai);

	// Instantiate MocaToken contract
	const mocaTokenContractAddress = '0xa2e400ce40c83270d8369ec971d0fc2e46d5056a'; 
	const mocaTokenContract = new ethers.Contract(
		mocaTokenContractAddress,
		MocaTokenAbi, 
		rpcSepolia
	);

	// Instantiate MocaOFT contract
	const mocaOftAddress = '0xaa7a95e597a65eb06dae4ed54f1b62e0535d9156'; 
	const mocaOftContract = new ethers.Contract(
		mocaOftAddress,
		MocaOftAbi, 
		rpcMumbai
	);

	// Call balanceOf function
	const mocaTokenAdapterAddress = '0x5a9962874aca3b407aceb14f64c7ef2c6255c880'; 
	const adapterBalance = await mocaTokenContract.balanceOf(mocaTokenAdapterAddress);
	console.log('Adapter Balance:', adapterBalance.toString());

	// Call totalSupply on OFT
	const oftBalance = await mocaOftContract.totalSupply();
	console.log('OFT Balance:', oftBalance.toString());
	
	if(adapterBalance != oftBalance) {

		const delta = BigInt(adapterBalance.toString()) - BigInt(oftBalance.toString());
		const deltaTokens = parseFloat(delta.toString()) / 1e18; 

		//break bridge
		const message = 
			`Adapter Balance: ${adapterBalance}
			 OFT Balance: ${oftBalance}
			 Delta: ${delta}
			 DeltaTokens: ${deltaTokens}`;

		await notifyTelegram(message, context);
	} 
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