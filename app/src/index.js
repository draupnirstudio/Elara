import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import {HashRouter as Router, Route} from 'react-router-dom'

import './index.css';
import 'semantic-ui-css/semantic.min.css';

import Auction from './components/auction/auction';
import Admin from './components/admin/admin';
import {Test} from "./components/test/test";

ReactDOM.render(
  <Router>
    <div className="content-wrapper">
      <div className="ui segment">
        <main>
          <Route exact={true} path="/" component={Auction}/>
          <Route path="/admin" component={Admin}/>
          <Route path="/test" component={Test}/>
        </main>
      </div>
    </div>
  </Router>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
