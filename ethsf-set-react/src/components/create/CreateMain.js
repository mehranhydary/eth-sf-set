import React, { Component } from 'react';
import SetProtocol from 'setprotocol.js';
import BigNumber from 'bignumber.js';
import { Button, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import axios from 'axios';


// Kovan configuration
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

export default class CreateMain extends Component {
    constructor() {
        super();
        const injectedWeb3 = window.web3 || undefined;
        let setProtocol;
        try {
          // Use MetaMask/Mist provider
          const provider = injectedWeb3.currentProvider;
          console.log('Injected web3 found:',provider)
          setProtocol = new SetProtocol(provider, config);
        } catch (err) {
          // Throws when user doesn't have MetaMask/Mist running
          throw new Error(`No injected web3 found when initializing setProtocol: ${err}`);
        }
    
        this.state = {
          setProtocol,
          web3: injectedWeb3,
          // Etherscan Links
          createdSetLink: '',
          createdSetAddress: '',
          createdIssueTransactionHash: '',
          createdRedeemTransactionHash: '',
          // To create the Set
          name: '',
          symbol: '',
          issueQty: ''
        };
        this.createSet = this.createSet.bind(this);
        this.issueSet = this.issueSet.bind(this);
        this.redeemSet = this.redeemSet.bind(this);
        this.getAccount = this.getAccount.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.renderIssueSuccessLabel = this.renderIssueSuccessLabel.bind(this);
        this.renderIssueButton = this.renderIssueButton.bind(this);
      }
      async createSet() {
        const { setProtocol } = this.state;
        const { units, naturalUnit } = await setProtocol.calculateSetUnitsAsync(
          componentAddresses,
          [new BigNumber(1), new BigNumber(1)],
          [new BigNumber(0.5), new BigNumber(0.5)],
          new BigNumber(1),
        );
        const name = this.state.name;
        const symbol = this.state.symbol;
        const txOpts = {
          from: this.getAccount(),
          gas: 4000000,
          gasPrice: 8000000000,
        };
      
        const txHash = await setProtocol.createSetAsync(
          componentAddresses,
          units,
          naturalUnit,
          name,
          symbol,
          txOpts,
        );
        // return await setProtocol.getSetAddressFromCreateTxHashAsync(txHash);
        const setAddress = await setProtocol.getSetAddressFromCreateTxHashAsync(txHash);
        this.setState({ 
            createdSetLink: `https://kovan.etherscan.io/address/${setAddress}`,
            createdSetAddress: setAddress
        });
        this.createSetInstanceOnDb()
      }
      async issueSet() {
        const { setProtocol, createdSetAddress, issueQty } = this.state;
        const issueQuantity = new BigNumber(new BigNumber(10 ** 18).mul(issueQty));
        const isMultipleOfNaturalUnit = await setProtocol.setToken.isMultipleOfNaturalUnitAsync(createdSetAddress, issueQuantity);
        await setProtocol.setUnlimitedTransferProxyAllowanceAsync(trueUSDAddress, { from: this.getAccount() });
        await setProtocol.setUnlimitedTransferProxyAllowanceAsync(daiAddress, { from: this.getAccount() });
        console.log(isMultipleOfNaturalUnit)
        if (isMultipleOfNaturalUnit) {
            try {
               const issueAddress = await setProtocol.issueAsync(
                createdSetAddress,
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
              this.updateSetInstanceOnDb()
            } catch (err) {
              throw new Error(`Error when issuing a new Set token: ${err}`);
            }
          } else {
            throw new Error(`Issue quantity is not multiple of natural unit. Confirm that your issue quantity is divisible by the natural unit.`);
          }
      }
      async redeemSet() {
        const { setProtocol, createdSetAddress, issueQty } = this.state;

        const setAddress = createdSetAddress;
        const quantity = new BigNumber(10 ** 18).mul(issueQty);
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
        this.updateSetInstanceOnDb();
      };

      handleChange(e) {
        let change = {};
        change[e.target.name] = e.target.value;
        this.setState(change);
      }
      createSetInstanceOnDb() {
        axios({
          method: 'post',
          url: 'http://localhost:8000/api/setcontracts',
          data: {
            name: this.state.name,
            symbol: this.state.symbol,
            quantity: this.state.issueQty,
            set_address: this.state.createdSetAddress,
          }
        })
        .then(response => {
          console.log('Set contract created in the db with the set contract address')
        })
        .catch(err => {
          console.log('Error creating entry in the db')
        })
      }
      updateSetInstanceOnDb() {
        axios({
          method: 'put',
          url: 'http://localhost:8000/api/setcontracts',
          data: {
            name: this.state.name,
            symbol: this.state.symbol,
            quantity: this.state.issueQty,
            set_address: this.state.createdSetAddress,
            issue_hash: this.state.createdIssueTransactionHash,
            redeem_hash: this.state.createdRedeemTransactionHash
          }
        })
        .then(response => {
          console.log('Set contract updated in the db with the latest parameters')
        })
        .catch(err => {
          console.log('Error updating entry in the db')
        })        
      }

      getAccount() {
        const { web3 } = this.state;
        if (web3.eth.accounts[0]) return web3.eth.accounts[0];
        throw new Error('Your MetaMask is locked. Unlock it to continue.');
      }
    
      renderEtherScanLink(link, content) {
        return (
            <Button href={link}>
              {content}
            </Button>
        );
      }
      renderIssueButton() {
          return (
            (<Button onClick={this.issueSet}>
                Issue your set
            </Button>)                     
          )
      }
      renderRedeemButton() {
        return (
          (<Button onClick={this.redeemSet}>
              Redeem your set
          </Button>)                     
        )
    }
      renderCreateSuccessLabel() {
        return (
          <header>
            <h2 className="App-title">Set is now Created!</h2>
            <p>{this.state.createdSetAddress}</p>
          </header>
        )
    }      
      renderIssueSuccessLabel() {
        return (
          <header>
            <h2 className="App-title">Set is now Issued!</h2>
            <p>{this.state.createdIssueTransactionHash}</p>
          </header>
        )
    }
    renderRedeemSuccessLabel() {
      return (
        <header>
          <h2 className="App-title">Set is now Redeemed!</h2>
          <p>{this.state.createdRedeemTransactionHash}</p>
        </header>
      )
  }    
      render() {
        const { createdSetAddress, createdIssueTransactionHash, createdRedeemTransactionHash } = this.state;
        return(
          <div>
            <header>
            <h1 className="App-title">Create your own Set</h1>
            </header>
            <form>
            <FormGroup
            controlId="formBasicText"
            >
                <ControlLabel>Please enter a name for the Set that you are creating</ControlLabel>
                <FormControl
                    type="text"
                    name="name"
                    value={this.state.name}
                    placeholder="Enter name"
                    onChange={this.handleChange}
                />
            </FormGroup>
            <FormGroup>
                <ControlLabel>Please enter a symbol for the Set that you are creating</ControlLabel>
                <FormControl
                    type="text"
                    name="symbol"
                    value={this.state.symbol}
                    placeholder="Enter symbol"
                    onChange={this.handleChange}
                />
            </FormGroup>
            <FormGroup>
                <ControlLabel>Please select the quantity of {this.state.symbol} to issue</ControlLabel>
                <FormControl
                    type="number"
                    name="issueQty"
                    value={this.state.issueQty}
                    placeholder="Enter quantity"
                    onChange={this.handleChange}
                />
            </FormGroup>            
        </form>
            <Button onClick={this.createSet}>
            Create My Set
            </Button>
            { createdSetAddress !== '' ? this.renderCreateSuccessLabel() : null }
            { createdSetAddress !== '' ? this.renderIssueButton() : null }
            { createdIssueTransactionHash !== '' ? this.renderIssueSuccessLabel() : null }
            { createdIssueTransactionHash !== '' ? this.renderRedeemButton() : null }
            { createdRedeemTransactionHash !== '' ? this.renderRedeemSuccessLabel() : null }
        </div>
        )
      }
}

