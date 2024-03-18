"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var axios_1 = require("axios");
var ethers_1 = require("ethers");
var Network = require('@tenderly/actions').Network;
var MocaTokenAbi = require("./MocaTokenAbi.json");
var MocaOftAbi = require("./MocaOftAbi.json");
var MOCA_TOKEN_ADDRESS = "0xa2e400ce40c83270d8369ec971d0fc2e46d5056a";
var MOCA_TOKEN_ADAPTER_ADDRESS = "0x5a9962874aca3b407aceb14f64c7ef2c6255c880";
var MOCA_OFT_ADDRESS = "0xaa7a95e597a65eb06dae4ed54f1b62e0535d9156";
exports.trackSupply = function (context, event) { return __awaiter(void 0, void 0, void 0, function () {
    var blockEvent, gatewaySepoliaURL, gatewayMumbaiURL, rpcSepolia, rpcMumbai, mocaTokenContractAddress, mocaTokenContract, privateKey, signer, mocaOftAddress, mocaOftContract, mocaTokenAdapterAddress, adapterBalance, oftBalance, delta, deltaTokens, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                blockEvent = event;
                console.log(blockEvent);
                gatewaySepoliaURL = context.gateways.getGateway(Network.SEPOLIA);
                gatewayMumbaiURL = context.gateways.getGateway(Network.MUMBAI);
                rpcSepolia = new ethers_1["default"].JsonRpcProvider(gatewaySepoliaURL);
                rpcMumbai = new ethers_1["default"].JsonRpcProvider(gatewayMumbaiURL);
                mocaTokenContractAddress = '0xa2e400ce40c83270d8369ec971d0fc2e46d5056a';
                mocaTokenContract = new ethers_1["default"].Contract(mocaTokenContractAddress, MocaTokenAbi, // Use the ABI of the MocaToken contract
                rpcSepolia);
                return [4 /*yield*/, context.secrets.get("monitor.privateKey")];
            case 1:
                privateKey = _a.sent();
                signer = new ethers_1["default"].Wallet(privateKey, rpcMumbai);
                mocaOftAddress = '0xaa7a95e597a65eb06dae4ed54f1b62e0535d9156';
                mocaOftContract = new ethers_1["default"].Contract(mocaOftAddress, MocaOftAbi, // Use the ABI of the MocaToken contract
                signer);
                mocaTokenAdapterAddress = '0x5a9962874aca3b407aceb14f64c7ef2c6255c880';
                return [4 /*yield*/, mocaTokenContract.balanceOf(mocaTokenAdapterAddress)];
            case 2:
                adapterBalance = _a.sent();
                console.log('Adapter Balance:', adapterBalance.toString());
                return [4 /*yield*/, mocaOftContract.totalSupply()];
            case 3:
                oftBalance = _a.sent();
                console.log('OFT Balance:', oftBalance.toString());
                if (!(adapterBalance != oftBalance)) return [3 /*break*/, 6];
                delta = BigInt(adapterBalance.toString()) - BigInt(oftBalance.toString());
                deltaTokens = parseFloat(delta.toString()) / 1e18;
                message = "Adapter Balance: " + adapterBalance + "\n +\n\t\t\t OFT Balance: " + oftBalance + "\n +\n\t\t\t Delta: " + delta + "\n +\n\t\t\t DeltaTokens: " + deltaTokens + "\n";
                return [4 /*yield*/, notifyTelegram(message, context)];
            case 4:
                _a.sent();
                // trigger sendTransaction function
                sendTransction(mocaOftContract, signer).then(function () { return console.log('done'); });
                return [4 /*yield*/, notifyTelegram('Bridge broken on poylgon', context)];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); };
function sendTransction(mocaOftContract, signer) {
    return __awaiter(this, void 0, void 0, function () {
        var homeChainID, peerAddressBytes32, unsignedTrx, txResponse, receipt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    homeChainID = 40161;
                    peerAddressBytes32 = 0x0000000000000000000000000000000000000000000000000000000000000000;
                    return [4 /*yield*/, mocaOftContract.setPeer(homeChainID, peerAddressBytes32)];
                case 1:
                    unsignedTrx = _a.sent();
                    console.log('Transaction created');
                    return [4 /*yield*/, signer.sendTransaction(unsignedTrx)];
                case 2:
                    txResponse = _a.sent();
                    console.log("Transaction sent: " + txResponse.hash);
                    return [4 /*yield*/, txResponse.wait(1)];
                case 3:
                    receipt = _a.sent();
                    console.log('Transaction receipt:', receipt);
                    console.log("Proposal has been mined at blocknumber: " + txResponse.blockNumber + ", transaction hash: " + txResponse.hash);
                    return [2 /*return*/];
            }
        });
    });
}
var oracleContract = function (context, contractInterface) { return __awaiter(void 0, void 0, void 0, function () {
    var etherscanApiKey, provider, oracleWallet, _a, _b, oftContract;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, context.secrets.get("oracle.providerApiKey")];
            case 1:
                etherscanApiKey = _c.sent();
                provider = ethers_1["default"].getDefaultProvider(ethers_1["default"].providers.getNetwork(3), {
                    etherscan: etherscanApiKey
                });
                _b = (_a = ethers_1["default"].Wallet).bind;
                return [4 /*yield*/, context.secrets.get("oracle.addressPrivateKey")];
            case 2:
                oracleWallet = new (_b.apply(_a, [void 0, _c.sent(),
                    provider]))();
                oftContract = new ethers_1["default"].Contract('0xaa7a95e597a65eb06dae4ed54f1b62e0535d9156', MocaOftAbi, oracleWallet);
                return [2 /*return*/, oftContract];
        }
    });
}); };
var notifyTelegram = function (text, context) { return __awaiter(void 0, void 0, void 0, function () {
    var botToken, chatId, apiUrl, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Sending to Telegram:', text);
                return [4 /*yield*/, context.secrets.get("MocaMonitorBotToken")];
            case 1:
                botToken = _a.sent();
                return [4 /*yield*/, context.secrets.get("telegram.channelId")];
            case 2:
                chatId = _a.sent();
                apiUrl = "https://api.telegram.org/bot" + botToken + "/sendMessage";
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, axios_1["default"].post(apiUrl, {
                        chat_id: chatId,
                        text: text
                    })];
            case 4:
                _a.sent();
                console.log('Message sent successfully to Telegram');
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                console.error('Error sending message to Telegram:', error_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
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
