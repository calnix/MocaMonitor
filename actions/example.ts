import {
	ActionFn,
	Context,
	Event,
	Network,
} from '@tenderly/actions';

import { ethers } from 'ethers';
import axios from 'axios';

import MocaTokenAbi from './MocaTokenAbi.json';
import MocaOftAbi from './MocaOftAbi.json';

const MOCA_TOKEN_ADDRESS = "0xF944e35f95E819E752f3cCB5Faf40957d311e8c5";
const MOCA_TOKEN_ADAPTER_ADDRESS = "0x2B11834Ed1FeAEd4b4b3a86A6F571315E25A884D";
const MOCA_OFT_ADDRESS = "0x2B11834Ed1FeAEd4b4b3a86A6F571315E25A884D";

export const tracker: ActionFn = async (context: Context, event: Event) => {
	const gatewayEthereum = context.gateways.getGateway(Network.MAINNET);
	const gatewayBase = context.gateways.getGateway(Network.BASE);
  	
	// Using the Ethers.js provider class to call the RPC URL
  	const rpcMainnet = new ethers.JsonRpcProvider(gatewayEthereum);
  	const rpcBase = new ethers.JsonRpcProvider(gatewayBase);

	// Instantiate MocaToken contract
	const mocaTokenContract = new ethers.Contract(MOCA_TOKEN_ADDRESS, MocaTokenAbi, rpcMainnet);

	// Call balanceOf function
	const adapterBalance = await mocaTokenContract.balanceOf(MOCA_TOKEN_ADAPTER_ADDRESS);
	console.log('Adapter Balance:', adapterBalance.toString());

    // Instantiate MocaOFT contract
		// Obtain the private key from context.secrets.get("oracle.addressPrivateKey")
		const privateKey = await context.secrets.get("monitor.privateKey.Live");
		const signer = new ethers.Wallet(privateKey, rpcBase);
    const mocaOftContract = new ethers.Contract(MOCA_OFT_ADDRESS, MocaOftAbi, signer);
	
   
    // Call totalSupply on OFT
    const oftBalance = await mocaOftContract.totalSupply();
    console.log('OFT Balance:', oftBalance.toString());

	if(adapterBalance != oftBalance) {

		const delta = BigInt(adapterBalance.toString()) - BigInt(oftBalance.toString());
		const deltaTokens = parseFloat(delta.toString()) / 1e18; 

		//break bridge
		const message = 
			`TENDERLY_BASE\n

			 Adapter Balance: ${adapterBalance}
			 OFT Balance: ${oftBalance}
			 Delta: ${delta}
			 DeltaTokens: ${deltaTokens}`;

		await notifyTelegram(message, context);

		// trigger sendTransaction function
		const hash = await sendTransaction(context, mocaOftContract);
		console.log('Base txn hash:', hash.toString());
		
		const hashMessage = 
			`TENDERLY_BASE\n
		resetPeer() called successfully on Base.\n
		https://basescan.org/tx/${hash.toString()}\n`;
		
		await notifyTelegram(hashMessage, context);

	} else {

		await notifyTelegram('Tenderly_Base\n Balances are equal: LIVE TEST', context);
		console.log('Balances are equal: LIVE TEST');
	}
}

async function sendTransaction(context: Context, mocaOftContract: ethers.Contract) {

	// break bridge from base side
	const remoteChainID = 30101;		// mainnet lazyerZero id
	
	const txn = await mocaOftContract.resetPeer(remoteChainID);	
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