import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import {HashRouter as Router, NavLink, Route} from 'react-router-dom'

import './index.css';
import 'semantic-ui-css/semantic.min.css';

import Welcome from './components/welcome/welcome';
import EnglishAuction from "./components/english-auction/english-auction";


ReactDOM.render(
  <Router>
    <div>
      
      <div className="ui grid">
        <div className="four wide column">
          <div className="ui vertical fluid tabular menu">
            
            <NavLink className='item' exact={true} activeClassName='active' to={`/`}>App</NavLink>
            <NavLink className='item' activeClassName='active' to={`/english-auction`}>
              English Auction
            </NavLink>
          
          </div>
        </div>
        <div className="twelve wide stretched column">
          <div className="ui segment">
            <main>
              
              <Route exact={true} path="/" component={Welcome}/>
              <Route path="/english-auction" component={EnglishAuction}/>
              
            </main>
          </div>
        </div>
      </div>
    </div>
  </Router>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
