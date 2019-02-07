import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch} from "react-router-dom";
import App from './App';
import { NoMatch } from './components/NoMatch';
import About from './components/About';

/** Basic container used to include navbar in one location no matter
 * which route is being utilized. Can also be used to control login status and
 * pass authentication functionality
 */
class BaseContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // loggedIn: true
    }
  }

  render() {
    return (
      <div>
        <Switch>
          <Route path="/" exact render={props => <App {...props} test={'extra-test-prop'} />} />
          <Route path="/about" exact component={About} />} />
          <Route component={NoMatch} />
        </Switch>
      </div>
    )
  }
}

const AppRouter = () => (
  <Router>
    <div>
      <Switch>
        <Route component={BaseContainer} /> 
      </Switch>
    </div>
  </Router>
);

export default AppRouter;