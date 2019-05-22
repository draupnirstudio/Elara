import React from "react";

export class EnglishAuctionForm extends React.Component {
  
  bidInputDidChange(event) {
    console.log(event);
  }
  
  bidButtonDidClick() {
  
  }
  
  render() {
    return (
      <table className="ui celled table">
        <tbody>
        <tr>
          <td>Current Round</td>
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
                     onChange={(event) => this.bidInputDidChange(event)}
              />
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            <button className="ui primary button" onClick={this.bidButtonDidClick}>
              bid
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    );
  }
}
