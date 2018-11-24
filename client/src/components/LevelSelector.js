import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import FilledInput from '@material-ui/core/FilledInput';
import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import NativeSelect from '@material-ui/core/NativeSelect';

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    // margin: theme.spacing.unit,
    minWidth: '100%',
  }
});

class LevelSelector extends React.Component {
  state = {
    level: 10,
    name: 'hai',
    labelWidth: 0,
  };

  componentDidMount() {
    // this.setState({
    //   labelWidth: ReactDOM.findDOMNode(this.InputLabelRef).offsetWidth,
    // });
  }

  handleChange = name => event => {
    this.setState({ [name]: event.target.value });
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor="level-select">Level</InputLabel>
          <Select
            native
            autowidth={true}
            value={this.state.level}
            onChange={this.handleChange('level')}
            inputProps={{
              name: 'level',
              id: 'level-select',
            }}
          >
            <option value={10} default>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </Select>
        </FormControl>
      </div>
    );
  }
}

LevelSelector.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(LevelSelector);