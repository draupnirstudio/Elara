import React from "react";
import * as _ from 'lodash';
const Default = 0;
const Warning = 1;
const Pass = 2;

export class EnglishAuctionForm extends React.Component {
  
  constructor(props) {
    super(props);
    
    this.state = {
      bidPrice: 0,
      info: null,
      infoColor: 'black',
      hasError: true
    };
  }
  
  componentDidMount() {
    this.setInfo('Please type a bid.');
  }
  
  bidInputDidChange = (event) => {
    const bidPrice = Number(event.target.value);
    
    if(!_.isNumber(bidPrice) || _.isNaN(bidPrice)) {
      this.setInfo('Please type a valid bid.', Warning);
    } else if (bidPrice <= this.props.currentPrice) {
      this.setInfo('Bid should larger than current price.', Warning);
    } else if (bidPrice > this.props.money) {
      this.setInfo('Bid should no larger than your money.', Warning);
    } else {
      this.setInfo('Now you can bid', Pass);
      this.setState({
        bidPrice: bidPrice
      });
    }
  };
  
  setInfo = (text, state) => {
    switch (state) {
      case Default:
        this.setState({infoColor: 'black'});
        break;
      case Warning:
        this.setState({infoColor: 'red', hasError: true});
        break;
      case Pass:
        this.setState({infoColor: 'green', hasError: false});
        break;
    }
    
    this.setState({info: text});
  };
  
  bidButtonDidClick = () => {
    this.props.bidButtonDidClick(this.state.bidPrice);
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
                     defaultValue={this.state.bidPrice}
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
                    disabled={this.state.hasError}>
              bid
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    );
  }
}
