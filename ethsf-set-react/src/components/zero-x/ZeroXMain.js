import React, { Component } from 'react';
import { assetDataUtils, orderHashUtils, signatureUtils } from '0x.js';
import { Order, SignedOrder, SignerType } from '@0xproject/types';
import BigNumber from 'bignumber.js';
import SetProtocol from 'setprotocol.js';
import { Button } from 'react-bootstrap';

const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1);
const config = {
    coreAddress: '0xdd7d1deb82a64af0a6265951895faf48fc78ddfc',
    setTokenFactoryAddress: '0x7497d12488ee035f5d30ec716bbf41735554e3b1',
    transferProxyAddress: '0xa0929aba843ff1a1af4451e52d26f7dde3d40f82',
    vaultAddress: '0x76aae6f20658f763bd58f5af028f925e7c5319af',
    rebalancingSetTokenFactoryAddress: '0xc1be2c0bb387aa13d5019a9c518e8bc93cb53360',
};

const trueUSDAddress = '0xadb015d61f4beb2a712d237d9d4c5b75bafefd7b';
const daiAddress = '0x1d82471142f0aeeec9fc375fc975629056c26cee';
const WETH_ADDRESS = '0xd0a1e359811322d97991e03f863a0c30c2cf029c';
const ZERO_EX_ERC20PROXY = '0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e';
const ZERO_EX_EXCHANGE_ADDRESS = '0x35dd2932454449b14cee11a94d3674a936d5d7b2'; 

const makerToken = WETH_ADDRESS;

export default class ZeroXMain extends Component {
    
    constructor() {
        super();
        const injectedWeb3 = window.web3 || undefined;
        let setProtocol;
        try {
            const provider = injectedWeb3.currentProvider;
            setProtocol = new SetProtocol(provider, config)
        } catch (err) {
            throw new Error (`No injected web3 fun when initializing setProtocol: ${err}`)
        }
        this.state = {
            setProtocol,
            web3: injectedWeb3,
        }
        this.approve = this.approve.bind(this);
        this.getAccount = this.getAccount.bind(this);
        this.fillOrder = this.fillOrder.bind(this);

    }
    getAccount() {
        const { web3 } = this.state;
        if (web3.eth.accounts[0]) return web3.eth.accounts[0];
        throw new Error('Your MetaMask is locked. Unlock it to continue.');
    }
    async approve () {
        const { setProtocol, web3 } = this.state;
        const [zeroExMaker] = web3.eth.accounts;
        await setProtocol.erc20.approveAsync(
            trueUSDAddress,
            ZERO_EX_ERC20PROXY,
            UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            { from: zeroExMaker },
          );
          await setProtocol.erc20.approveAsync(
            daiAddress,
            ZERO_EX_ERC20PROXY,
            UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            { from: zeroExMaker },
          );
    }
    async fillOrder () {
        const { setProtocol, web3 } = this.state;
        // orders: 
        const [zeroExMaker] = web3.eth.accounts;
        const zeroExOrderTrueUSD = {
            exchangeAddress: ZERO_EX_EXCHANGE_ADDRESS,
            expirationTimeSeconds: setProtocol.orders.generateExpirationTimestamp(60),
            feeRecipientAddress: SetProtocol.NULL_ADDRESS,
            makerAddress: zeroExMaker,
            makerAssetAmount: new BigNumber(50000000000000000000),
            makerAssetData: assetDataUtils.encodeERC20AssetData(trueUSDAddress),
            makerFee: new BigNumber(0),
            salt: setProtocol.orders.generateSalt(),
            senderAddress: SetProtocol.NULL_ADDRESS,
            takerAddress: SetProtocol.NULL_ADDRESS,
            takerAssetAmount: new BigNumber(170000000000000000),
            takerAssetData: assetDataUtils.encodeERC20AssetData(makerToken),
            takerFee: new BigNumber(0),
          };
          
          const zeroExOrderDai = {
            exchangeAddress: ZERO_EX_EXCHANGE_ADDRESS,
            expirationTimeSeconds: setProtocol.orders.generateExpirationTimestamp(60),
            feeRecipientAddress: SetProtocol.NULL_ADDRESS,
            makerAddress: zeroExMaker,
            makerAssetAmount: new BigNumber(50000000000000000000),
            makerAssetData: assetDataUtils.encodeERC20AssetData(daiAddress),
            makerFee: new BigNumber(0),
            salt: setProtocol.orders.generateSalt(),
            senderAddress: SetProtocol.NULL_ADDRESS,
            takerAddress: SetProtocol.NULL_ADDRESS,
            takerAssetAmount: new BigNumber(170000000000000000),
            takerAssetData: assetDataUtils.encodeERC20AssetData(makerToken),
            takerFee: new BigNumber(0),
          };        
          // TRUE USD
        const trueUSDZeroExOrderHash = orderHashUtils.getOrderHashHex(zeroExOrderTrueUSD);
        const trueUSDZeroExOrderSig = await signatureUtils.ecSignOrderHashAsync(
            web3.currentProvider,
            trueUSDZeroExOrderHash,
            zeroExMaker,
            SignerType.Default,
        );
        const trueUSDSignedZeroExOrder= Object.assign(
            {},
            zeroExOrderTrueUSD,
            { signature: trueUSDZeroExOrderSig }
        );
        const zeroExSignedOrderTrueUSD = Object.assign(
            {},
            trueUSDSignedZeroExOrder,
            { fillAmount: trueUSDSignedZeroExOrder.takerAssetAmount },
        );
          // DAI 
        const daiZeroExOrderHash = orderHashUtils.getOrderHashHex(zeroExOrderDai);
        const daiZeroExOrderSig = await signatureUtils.ecSignOrderHashAsync(
            web3.currentProvider,
            daiZeroExOrderHash,
            zeroExMaker,
            SignerType.Default,
        );
        const daiSignedZeroExOrder = Object.assign(
            {},
            zeroExOrderDai,
            { signature: daiZeroExOrderSig }
        );
        const zeroExSignedOrderDai = Object.assign(
            {},
            daiSignedZeroExOrder,
            { fillAmount: daiSignedZeroExOrder.takerAssetAmount },
        );
          
          const orders = [zeroExSignedOrderTrueUSD, zeroExSignedOrderDai];
          const txOpts = {
            from: this.getAccount(),
            gas: 4000000,
            gasPrice: 8000000000,
          };
        let tx = await setProtocol.orders.fillOrderAsync(
            orders,
            10,
            orders,
            txOpts
        )
        console.log(tx);
    }
    

    render() {
        const { web3, setProtocol } = this.state;

        return(
          <div>
            <header>
                <h1 className="App-title">Welcome to the 0x page!  Time to enhance the solution!</h1>
            </header>
            <Button bsStyle="primary" onClick = {() => this.approve()}>Approve</Button>
            <Button bsStyle="danger" onClick = {() => this.fillOrder()}>Fill Order</Button>
        </div>
        )
      }     
}

