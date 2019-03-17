import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import FilledInput from '@material-ui/core/FilledInput';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  selectMenu: {
    margin: theme.spacing.unit,
    maxWidth: '100%'
  }
});

const ColormapDropdown = (props) => {
  // state = {
  //   age: '',
  //   name: 'hai',
  //   labelWidth: 0,
  // };

  // componentDidMount() {
  //   this.setState({
  //     labelWidth: ReactDOM.findDOMNode(this.InputLabelRef).offsetWidth,
  //   });
  // }

  // handleChange = event => {
  //   this.setState({ [event.target.name]: event.target.value });
  // };

  // TODO include function to build menu items from colorramp array 
  // need a mapping between colorramp and s3 url (put that at the top of layers.js)

  const { classes } = props;

  return (
    <div>
        <Select
          value={10}
          autoWidth={false}
          onChange={()=> console.log('do stuff')}
          displayEmpty
          name="age"
          className={classes.selectMenu}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>
            <img src='https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/colorramps/jet_colorbar.png' />
          </MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </div>
  )
}

ColormapDropdown.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ColormapDropdown);