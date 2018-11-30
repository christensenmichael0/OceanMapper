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

function LevelSelector(props) {
  
  const handleChange = name => event => {
    // TODO: this needs to reach back to App.js
    console.log('change triggered in level selector component!')
    // props.handleLevelChange(name, value);
    // this.setState({ [name]: event.target.value });
  };

  const buildLevels = availableLevels => {
    return (
      availableLevels.map((level, indx) => 
        <option value={level} index={indx}>{level}</option>
      )
    )
  }

  const { classes, availableLevels, presentLevel } = props;

  return (
    <div className={classes.root}>
      <FormControl className={classes.formControl}>
        <InputLabel htmlFor='level-select'>Level</InputLabel>
        <Select
          native
          autowidth={true}
          value={presentLevel || 0} // this might fix itself once the onChange is updated
          onChange={() => console.log('do nothing for now!')} // handleChange('level')
          inputProps={{
            name: 'levels',
            id: 'level-select',
          }}
        >
        {buildLevels(availableLevels)}
        </Select>
      </FormControl>
    </div>
  );
}

LevelSelector.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(LevelSelector);