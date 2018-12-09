import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

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

  const buildLevels = availableLevels => {
    return (
      availableLevels.map((level, index) => 
        <option key={index} value={level} index={index}>{level}</option>
      )
    )
  }

  const { classes, availableLevels, presentLevel, id, levelName, handleLevelChange } = props;
  return (
    <div className={classes.root}>
      <FormControl className={classes.formControl}>
        <InputLabel htmlFor='level-select'>{levelName}</InputLabel>
        <Select
          native
          autowidth='true'
          value={presentLevel || 0} // this might fix itself once the onChange is updated
          onChange={handleLevelChange.bind(this, id)} // handleChange(id)
          inputProps={{
            name: 'levels',
            id: id,
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