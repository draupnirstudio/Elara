import React from "react";
import * as _ from 'lodash';

const Default = 0;
const Warning = 1;
const Pass = 2;

export class AuctionForm extends React.Component {
  
  constructor(props) {
    super(props);
    
    this.state = {
      bid: 0,
      info: null,
      infoColor: 'black',
      hasError: true
    };
  }
  
  componentWillReceiveProps(nextProps, nextContext) {
    if (this.props.hasBid === false && nextProps.hasBid === true) {
      this.setInfo('You have already bid, please wait for next round.', Pass);
    } else if (this.props.money === 0) {
      this.setInfo('You have run out of money.', Pass);
    }
    
    if(this.props.currentPrice !== nextProps.currentPrice) {
      this.reset();
    }
  
    this.setState({bid: nextProps.currentBid});
  }
  
  componentDidMount() {
    if (this.props.hasBid) {
      this.setInfo('You have already bid, please wait for next round.', Pass);
    } else if (this.props.money === 0) {
      this.setInfo('You have run out of money.', Pass);
    } else if (this.props.currentRound === 0 ) {
      this.setInfo('Please wait auction start.', Pass);
    } else {
      this.setInfo('Please type a bid.');
    }
  
    this.setState({bid:this.props.currentBid});
  }
  
  bidInputDidChange = (event) => {
    this.setState({bid: event.target.value});
    
    const bidPrice = Number(event.target.value);
    
    if (this.props.hasBid) {
      this.setInfo('You have already bid, please wait for next round.', Pass);
    } else if (this.props.money === 0) {
      this.setInfo('You have run out of money.', Pass);
    } else if (!_.isNumber(bidPrice) || _.isNaN(bidPrice)) {
      this.setInfo('Please type a valid bid.', Warning);
    } else if (bidPrice <= this.props.currentPrice) {
      this.setInfo('Bid should larger than current price.', Warning);
    } else if (bidPrice > this.props.money) {
      this.setInfo('Bid should no larger than your money.', Warning);
    } else {
      this.setInfo('Now you can bid', Pass);
    }
  };
  
  setInfo = (text, state) => {
    switch (state) {
      case Default:
        this.setState({infoColor: 'black', hasError: true});
        break;
      case Warning:
        this.setState({infoColor: 'red', hasError: true});
        break;
      case Pass:
        this.setState({infoColor: 'green', hasError: false});
        break;
      default:
        this.setState({infoColor: 'black', hasError: true});
        break;
    }
    
    this.setState({info: text});
  };
  
  bidButtonDidClick = () => {
    this.props.bidButtonDidClick(this.state.bid);
  };
  
  reset = () => {
    this.setState({
      bid: 0,
    });
  
    if (this.props.hasBid) {
      this.setInfo('You have already bid, please wait for next round.', Pass);
    } else if (this.props.money === 0) {
      this.setInfo('You have run out of money.', Pass);
    } else {
      this.setInfo('Please type a bid.');
    }
  };
  
  render() {
    return (
      <table className="ui celled table" style={{width: '500px'}}>
        <tbody>
        <tr>
          <td style={{width: '40%'}}>Current Round</td>
          <td>{this.props.currentRound}</td>
        </tr>
        <tr>
          <td>Current Price</td>
          <td>{this.props.currentPrice}</td>
        </tr>
        <tr>
          <td>Your Money</td>
          <td>{this.props.money}</td>
        </tr>
        <tr>
          <td>
            Your Bid
          </td>
          <td>
            <div className="ui input">
              <input type="text"
                     placeholder="Your Bid"
                     disabled={this.props.hasBid || this.props.money === 0 || this.props.currentRound === 0}
                     value={this.state.bid}
                     onChange={this.bidInputDidChange}
              />
            </div>
          </td>
        </tr>
        <tr>
          <td>
            Info
          </td>
          <td>
            <span style={{color: this.state.infoColor}}>
            {this.state.info}
            </span>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <button className="ui primary button fluid" onClick={this.bidButtonDidClick}
                    disabled={this.state.hasError || this.props.hasBid || this.props.money === 0 || this.props.currentRound === 0}>
              bid
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    );
  }
}
