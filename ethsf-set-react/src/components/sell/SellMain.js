import React, { Component } from "react";
import { Table, Button } from 'react-bootstrap';
import axios from 'axios';
import SetProtocol from 'setprotocol.js';
import BigNumber from 'bignumber.js';

const config = {
    coreAddress: '0xdd7d1deb82a64af0a6265951895faf48fc78ddfc',
    setTokenFactoryAddress: '0x7497d12488ee035f5d30ec716bbf41735554e3b1',
    transferProxyAddress: '0xa0929aba843ff1a1af4451e52d26f7dde3d40f82',
    vaultAddress: '0x76aae6f20658f763bd58f5af028f925e7c5319af',
    rebalancingSetTokenFactoryAddress: '0xc1be2c0bb387aa13d5019a9c518e8bc93cb53360',
};

const trueUSDAddress = '0xadb015d61f4beb2a712d237d9d4c5b75bafefd7b';
const daiAddress = '0x1d82471142f0aeeec9fc375fc975629056c26cee';

const componentAddresses = [trueUSDAddress, daiAddress];

export default class SellMain extends Component {
    constructor(){
        super();
        const injectedWeb3 = window.web3 || undefined;
        let setProtocol;
        try {
            const provider = injectedWeb3.currentProvider;
            console.log('Injected web3 found:', provider);
            setProtocol = new SetProtocol(provider, config);
        } catch (err) {
            throw new Error (`No injected web3 fun when initializing setProtocol: ${err}`)
        }
        this.state = {
            setProtocol,
            web3: injectedWeb3,
            transactions: [],
            loading: false,
            mostRecent: '',
            setContracts: [],
            createdIssueTransactionHash: '',
            createdRedeemTransactionHash: '',
            sold: false,
            approved: false
        }
        this.getAccount = this.getAccount.bind(this);
        this.getTransactionsForActiveAccount = this.getTransactionsForActiveAccount.bind(this);
        this.renderTransactionTable = this.renderTransactionTable.bind(this);
        this.addToTransactionArray = this.addToTransactionArray.bind(this);
        this.readTransferEventsForSets = this.readTransferEventsForSets.bind(this);
        this.renderEventsForAllSets = this.renderEventsForAllSets.bind(this);
    }

    componentWillMount(){
        this.getTransactionsForActiveAccount();
        this.getAllSetContractsForThisAccount();
    }
    readTransferEventsForSets = (contract_address) => {
        const { web3 } = this.state
        web3.eth.filter({
        address: contract_address,
        fromBlock: 1,
        toBlock: 'latest'
        }).get(function (err, result) {
            console.log(result);
            return(
                <div>
                    result
                </div>
            )
        })
    }
    renderEventsForAllSets = () => {
        const { setContracts } = this.state;
        return setContracts.map((value, index) => {
            this.readTransferEventsForSets(value.set_address)
        })
    }
    getAllSetContractsForThisAccount() {
        axios({
          method: 'get',
          url: 'http://localhost:8000/api/setcontracts'
        })
        .then(response => {
          this.setState({setContracts: response.data})
        })
        .catch(err => {
          console.log('Error finding entries in the db')
        })
    }
    getAccount() {
        const { web3 } = this.state;
        if (web3.eth.accounts[0]) return web3.eth.accounts[0];
        throw new Error('Your MetaMask is locked. Unlock it to continue.');
    }
    renderTransactionTable = () => {
        const { transactions } = this.state;
        return transactions.map((value, index) => {
            return (
                <tr key = {index}>
                
                    <td>{JSON.parse(value).hash}</td>
                    <td>{JSON.parse(value).blockNumber}</td>
                    <td className='details'>to be confirmed{/*<span>{(JSON.parse(value).input)}</span>*/}</td>
                    {/* <td><Button bsStyle="danger">Sell</Button></td> */}
                </tr>

            )
        })
        
    }
    addToTransactionArray = (object) => {
        const { transactions } = this.state;
        var newArray = transactions.lengh > 0 ? transactions.slice() : transactions;
        newArray.push(JSON.stringify(object));
        this.setState({transactions: newArray})
    }
    getTransactionsForActiveAccount = () => {
        let _this = this
        const { web3 } = this.state;
        const account = this.getAccount();
        const endBlockNumber = 8990612;
        const startBlockNumber = endBlockNumber - 2000;
          for (var i = startBlockNumber; i <= endBlockNumber; i++) {
            web3.eth.getBlock(i, true, function(err, block){
                if (block != null && block.transactions != null) {
                    block.transactions.forEach( function(e, counter) {
                      if ((account === "*" || account === e.from) && e.to === '0xdd7d1deb82a64af0a6265951895faf48fc78ddfc') {
                        _this.addToTransactionArray(e);

                      }
                    })
                }
            });
            if(i === endBlockNumber) {
                _this.setState( {loading: true} )
            }
          }
    }
    renderSetContractList = () => {
        const { setContracts } = this.state;
        return setContracts.map((value, index) => {
            return (
                value.sold === true ? null : (
                <tr key = {index}>
                    <td>{(value.issue_hash !== null) && (value.redeem_hash === null) ? <Button onClick = {() => this.approve(value.id)} bsStyle='info'>Sell</Button> : null }</td>
                    <td>{value.symbol}</td>
                    <td>{value.quantity}</td>
                    <td>{value.set_address}</td>
                    <td>{value.issue_hash == null ? <Button onClick = {() => this.issueSet(value.id)} bsStyle="success">Issue coins to your Set</Button> : value.issue_hash }</td>
                    <td>{value.redeem_hash == null ? <Button onClick = {() => this.redeemSet(value.id)} bsStyle="warning">Redeem your Set</Button> : value.redeem_hash }</td>
                </tr>)
            )
        })
    }
    updateSetInstanceOnDb(name) {
        axios({
          method: 'put',
          url: 'http://localhost:8000/api/setcontracts',
          data: {
            name,
            issue_hash: this.state.createdIssueTransactionHash,
            redeem_hash: this.state.createdRedeemTransactionHash,
            sold: this.state.sold,
            approved: this.state.approved

          }
        })
        .then(response => {
          console.log('Set contract updated in the db with the latest parameters')
        })
        .catch(err => {
          console.log('Error updating entry in the db')
        })        
      }
    async issueSet(id) {
        axios({
            method: 'get',
            url: `http://localhost:8000/api/setcontracts/${id}`
        })
        .then(async (response) => {
            const { setProtocol, createdIssueTransactionHash} = this.state;
            const issueQuantity = new BigNumber(new BigNumber(10 ** 18).mul(response.data.quantity));
            const isMultipleOfNaturalUnit = await setProtocol.setToken.isMultipleOfNaturalUnitAsync(response.data.set_address, issueQuantity);
            await setProtocol.setUnlimitedTransferProxyAllowanceAsync(trueUSDAddress, { from: this.getAccount() });
            await setProtocol.setUnlimitedTransferProxyAllowanceAsync(daiAddress, { from: this.getAccount() });
            if (isMultipleOfNaturalUnit) {
                try {
                   const issueAddress = await setProtocol.issueAsync(
                    response.data.set_address,
                    issueQuantity,
                    {
                        from: this.getAccount(),
                        gas: 4000000,
                        gasPrice: 8000000000,
                    },
                  );
                  this.setState({
                    createdIssueTransactionHash: issueAddress
                  })
                  this.updateSetInstanceOnDb(response.data.name)
                } catch (err) {
                  throw new Error(`Error when issuing a new Set token: ${err}`);
                }
              } else {
                throw new Error(`Issue quantity is not multiple of natural unit. Confirm that your issue quantity is divisible by the natural unit.`);
              }
        })

      }
      async redeemSet(id) {
        axios({
            method: 'get',
            url: `http://localhost:8000/api/setcontracts/${id}`
        })
        .then(async (response) => {
            const { setProtocol } = this.state;
            const setAddress = response.data.set_address;
            const quantity = new BigNumber(10 ** 18).mul(response.data.quantity);
            const withdraw = true;
            const tokensToExclude = [];
            const txOpts = {
                from: this.getAccount(),
                gas: 4000000,
                gasPrice: 8000000000,
              };
              const txHash = await setProtocol.redeemAsync(
                setAddress,
                quantity,
                withdraw,
                tokensToExclude,
                txOpts,
              );
              this.setState({
                createdRedeemTransactionHash: txHash
              })
              this.updateSetInstanceOnDb(response.data.name);
        })
      };  
      async approve(id) {
        axios({
            method: 'get',
            url: `http://localhost:8000/api/setcontracts/${id}`
        })
        .then(async (response) => {
            const { setProtocol } = this.state;
            const setAddress = response.data.set_address;
            const quantity = new BigNumber(10 ** 18).mul(response.data.quantity);
            const spenderAddress = this.getAccount();
            const txOpts = {
                from: this.getAccount(),
                gas: 4000000,
                gasPrice: 8000000000,
            };
            if(!response.data.approved){
                const txHash = await setProtocol.erc20.approveAsync(
                    setAddress,
                    spenderAddress,
                    quantity,
                    txOpts
                )
                this.setState({
                    approved: true
                })
                this.updateSetInstanceOnDb(response.data.name)
            }
            this.transferFrom(response.data.id)
        })
      }
      async transferFrom(id) {
        axios({
            method: 'get',
            url: `http://localhost:8000/api/setcontracts/${id}`
        })
        .then(async (response) => {
            const { setProtocol } = this.state;
            const setAddress = response.data.set_address;
            const quantity = new BigNumber(10 ** 18).mul(response.data.quantity);
            const txOpts = {
                from: this.getAccount(),
                gas: 4000000,
                gasPrice: 8000000000,
              };
              const txHash = await setProtocol.erc20.transferFromAsync(
                setAddress,
                this.getAccount(),
                this.getAccount(),
                quantity,
                txOpts
              );
              this.setState({
                sold: true
               })
            this.updateSetInstanceOnDb(response.data.name) 
        })
      };        
    hex2a(hexString) {
        var hex = hexString.toString(); 
        var str = '';
        for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }
    render() {
        const { loading } = this.state;

        return (  
            <div>
                <header>
                <h1 className="App-title">Welcome to the sell page</h1>
                </header>       
                <header>
                    <h2 className="App-title">Your sets!</h2><h5>{this.getAccount()}</h5>
                    <p>Here is a list of all of your Sets.  You will be able to sell the ones that have been issued, but have not been redeemed yet.</p>
                    <p>To issue tokens to your Set - please select the green button under the issue address button (if it appears).</p>
                    <p>To redeem tokens from your Set - please select the yellow button under the redeem address button (if it appears).</p>
                </header>     
                <div>
                    <Table striped bordered condensed hover responsive>
                        <thead>
                            <tr>
                                {/* <th>id</th> */}
                                <th>sell?</th>
                                <th>symbol</th>
                                <th>quantity</th>
                                <th>set address</th>
                                <th>issue address</th>
                                <th>redeem address</th>
                            </tr>
                        </thead>
                        <tbody>
                            { this.renderSetContractList() }
                        </tbody>
                    </Table>
                </div>           
                <div>
                </div>          
                <header>
                    <h3 className="App-title">Transactions sent to the core Set Protocol Address</h3>
                    {/* this.renderEventsForAllSets() */}

                </header>     
                <div>
                    <Table striped bordered condensed hover responsive>
                        <thead>
                            <tr>
                                <th>hash</th>
                                <th>blockNumber</th>
                                <th>input</th>
                                {/* You can't sell if you you've redeemed the ERC20 tokens */}
                            </tr>
                        </thead>
                        <tbody>
                            { loading === true ? this.renderTransactionTable() : null }
                        </tbody>
                    </Table>
                </div>
            </div>
        );
    }
}