import React from 'react';

import {getUserId, socket} from "../../utils/socket";
import {NoAuction} from "../../constants/auction-type";

import './admin.css';
import {NormalDistribution, UniformDistribution, WeibullDistribution} from "../../constants/auction-algorithm";
import {UnknownError} from "../../constants/auction-error";


class Admin extends React.Component {
  
  initialState = {
    auctionType: NoAuction,
    isAuctionStart: false,
    currentPrice: 0,
    currentRound: 0,
    defaultMoney: 0,
    nextPrice: 0,
    algorithm: NormalDistribution,
    mean: 0,
    deviation: 0,
    userBidHistory: [],
    isWaitingAuctionStart: false,
  };
  
  constructor(props) {
    super(props);
    
    this.state = this.initialState;
  }
  
  componentDidMount() {
    socket.emit('admin-user-registered', {
      userId: getUserId()
    });
    
    socket.on('user-connected', (data) => {
      console.log('user connected', data);
      socket.emit('resume-auction-admin');
    });
    
    socket.on('auction-start', (data) => {
      console.log('auction start', data);
      
      this.setState({isWaitingAuctionStart: false});
      
      this.setState({
        isAuctionStart: true,
        auctionType: data.auctionType,
        defaultMoney: data.money,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound
      });
    });
    
    socket.on('auction-start-error', (data) => {
      console.log('auction start error', data);
      switch (data.code) {
        case UnknownError:
          alert("start auction error, please try again");
          break;
        default:
          break;
      }
    });
    
    socket.on('auction-stop', (data) => {
      console.log('auction stop', data);
      this.setState(this.initialState);
    });
    
    socket.on('next-round', data => {
      console.log('next round', data);
      this.setState({
        currentPrice: data.currentPrice,
        currentRound: data.currentRound
      })
    });
    
    socket.on('resume-auction', (data) => {
      console.log('auction resumed', data);
      
      this.setState({
        isAuctionStart: data.isAuctionStart,
        auctionType: data.auctionType,
        currentPrice: data.currentPrice,
        currentRound: data.currentRound,
        defaultMoney: data.defaultMoney
      });
    });
    
    socket.on('next-round-price-admin', (data) => {
      console.log('next price: ', data);
      this.setState({nextPrice: data.nextPrice});
    });
    
    socket.on('user-did-bid', (data) => {
      console.log('user did bid', data);
      this.setState({userBidHistory: [...this.state.userBidHistory, data]});
    });
    
    socket.on('default-money-changed', (data) => {
      console.log('default money changed', data);
      alert(`default money changed to ${data.defaultMoney}`);
    });
    
    socket.on('bid-history-fetched', (data) => {
      console.log('bid-history-fetched', data);
      this.setState({userBidHistory: [...data]});
    });
    
    socket.on('algorithm-config-admin', (data) => {
      console.log('algorithm config', data);
      this.setState({
        algorithm: data.algorithm,
        mean: data.mean,
        deviation: data.deviation
      });
    });
    
    socket.on('algorithm-changed', (data) => {
      console.log('algorithm changed', data);
      console.log(`algorithm changed to ${data.algorithm}`);
    });
    
    socket.on('algorithm-mean-changed', (data) => {
      console.log('algorithm mean changed', data);
      alert(`algorithm mean changed to ${data.mean}`);
    });
    
    socket.on('algorithm-deviation-changed', (data) => {
      console.log('algorithm deviation changed', data);
      alert(`algorithm deviation changed to ${data.deviation}`);
    });
  }
  
  startEnglishAuction = () => {
    this.setState({isWaitingAuctionStart: true});
    socket.emit("start-english-auction-admin");
  };
  
  startNextRound = () => {
    socket.emit("start-next-round-admin", {
      nextPrice: this.state.nextPrice
    });
  };
  
  stopAuction = () => {
    socket.emit("stop-auction-admin");
    this.setState({
      auctionType: NoAuction
    })
  };
  
  
  nextPriceDidChange = (event) => {
    this.setState({nextPrice: event.target.value});
  };
  
  meanDidChange = (event) => {
    this.setState({mean: event.target.value});
  };
  
  deviationDidChange = (event) => {
    this.setState({deviation: event.target.value});
  };
  
  setDefaultMoney = () => {
    socket.emit("set-default-money-admin", {defaultMoney: this.state.defaultMoney});
  };
  
  setMean = () => {
    socket.emit("set-algorithm-mean-admin", {mean: this.state.mean});
  };
  
  setDeviation = () => {
    socket.emit("set-algorithm-deviation-admin", {deviation: this.state.deviation});
  };
  
  defaultMoneyDidChange = (event) => {
    this.setState({defaultMoney: event.target.value});
  };
  
  handleAlgorithmChange = (event) => {
    this.setState({algorithm: event.target.value}, () => {
      socket.emit("set-algorithm-admin", {algorithm: this.state.algorithm});
    });
  };
  
  
  render() {
    const UserBidHistory = this.state.userBidHistory.map((e) =>
      <tr key={`${e.user}-${e.round}`}>
        <td>{e.user}</td>
        <td>{e.round}</td>
        <td>{e.price}</td>
        <td>{e.startMoney}</td>
        <td>{e.bid}</td>
        <td>{e.remainMoney}</td>
      </tr>
    );
    
    let AlgorithmConfigPanel;
    switch (this.state.algorithm) {
      case NormalDistribution:
        AlgorithmConfigPanel = (
          <div>
            <div>
              <span>mean:</span>
              <div className="ui input">
                <input
                  type="number"
                  value={this.state.mean}
                  onChange={this.meanDidChange}
                />
              </div>
              <button
                className="ui button"
                onClick={this.setMean}>
                update
              </button>
            </div>
            <div>
              <span>dev:</span>
              <div className="ui input">
                <input
                  type="number"
                  value={this.state.deviation}
                  onChange={this.deviationDidChange}
                />
              </div>
              <button
                className="ui button"
                onClick={this.setDeviation}>
                update
              </button>
            </div>
          </div>
        );
        break;
      case UniformDistribution:
        AlgorithmConfigPanel = (
          <div>Under Construction</div>
        );
        break;
      case WeibullDistribution:
        AlgorithmConfigPanel = (
          <div>Under Construction</div>
        );
        break;
    }
    
    return (
      <div>
        <div className="item-wrapper">
          <button className="ui button" disabled={this.state.isAuctionStart || this.state.isWaitingAuctionStart}
                  onClick={this.startEnglishAuction}>
            start english auction
          </button>
          <button className="ui negative button" disabled={!this.state.isAuctionStart} onClick={this.stopAuction}>
            stop auction
          </button>
        </div>
        
        <div className="item-wrapper" style={{display: this.state.isAuctionStart ? 'block' : 'none'}}>
          <button className="ui primary button" disabled={!this.state.isAuctionStart} onClick={this.startNextRound}>
            start round {this.state.currentRound + 1}
          </button>
        </div>
        
        <div className="item-wrapper">
          <span>auction status: </span> {this.state.auctionType}
        </div>
        
        <div className="auction-info-wrapper" style={{display: this.state.isAuctionStart ? 'block' : 'none'}}>
          
          <div className="item-wrapper">
            <span>default money:</span>
            <div className="ui input">
              <input
                type="text"
                value={this.state.defaultMoney || 0}
                onChange={this.defaultMoneyDidChange}
              />
            </div>
            <button
              className="ui button"
              onClick={this.setDefaultMoney}>
              update
            </button>
          </div>
          
          <div className="item-wrapper">
            <div>algorithm:</div>
            <div className=" ui form">
              <div className="inline fields">
                <div className="field">
                  <div className="ui radio checkbox">
                    <input type="radio" name="algorithm"
                           id={NormalDistribution}
                           onChange={this.handleAlgorithmChange}
                           checked={this.state.algorithm === NormalDistribution}
                           value={NormalDistribution}/>
                    <label className="cursor-pointer" htmlFor={NormalDistribution}>normal distribution</label>
                  </div>
                </div>
                <div className="field">
                  <div className="ui radio checkbox">
                    <input type="radio" name="algorithm"
                           id={UniformDistribution}
                           onChange={this.handleAlgorithmChange}
                           checked={this.state.algorithm === UniformDistribution}
                           value={UniformDistribution}/>
                    <label className="cursor-pointer" htmlFor={UniformDistribution}>uniform distribution</label>
                  </div>
                </div>
                <div className="field">
                  <div className="ui radio checkbox">
                    <input type="radio" name="algorithm"
                           id={WeibullDistribution}
                           onChange={this.handleAlgorithmChange}
                           checked={this.state.algorithm === WeibullDistribution}
                           value={WeibullDistribution}/>
                    <label className="cursor-pointer" htmlFor={WeibullDistribution}>weibull distribution</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="item-wrapper">
            {AlgorithmConfigPanel}
          </div>
          
          <div className="item-wrapper">
            <span>current round: </span> {this.state.currentRound}
          </div>
          
          <div className="item-wrapper">
            <span>current price: </span>{this.state.currentPrice}
          </div>
          
          <div className="item-wrapper">
            <span>next price:</span>
            <div className="ui input">
              <input
                type="number"
                value={this.state.nextPrice || 0}
                onChange={this.nextPriceDidChange}
              />
            </div>
          </div>
          
          <div className="item-wrapper"
               style={{display: this.state.isAuctionStart ? 'block' : 'none'}}>
            <table className="ui celled table text-center">
              <thead>
              <tr>
                <th>userId</th>
                <th>round</th>
                <th>price</th>
                <th>startMoney</th>
                <th>bid</th>
                <th>remainMoney</th>
              </tr>
              </thead>
              <tbody>
              {UserBidHistory}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default Admin;
