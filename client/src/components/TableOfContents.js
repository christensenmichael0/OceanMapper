import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import TOCskeleton from '../scripts/layers';
import TOCExpansionPanel from './TOCExpansionPanel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import LevelSelector from './LevelSelector';


// https://stackoverflow.com/questions/35905988/react-js-how-to-append-a-component-on-click

const styles = theme => ({
  img: {
    width: '100%',
  },
});

// class TableOfContents extends React.Component {
//   constructor(props) {
//     super(props);
    
//     this.state = {
//       open: false,
//     };

//     this.handleLayerToggle = this.handleLayerToggle.bind(this);
//   }

//   render() {

//   }
// }

function TableOfContents(props) {
  const {toc, classes, ...other} = props;
  // debugger
  console.log(toc)

  const buildContents = categoryObj => {
    return (
      categoryObj['Layers'].map((layer, indx) => {
        if ('subResources' in layer) {
          return (
            layer['subResources'].map((subresource, indx) => {
              if (subresource['visibleTOC']) {
                return (
                  <React.Fragment>
                    <FormGroup row={false}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={props[subresource['id']] ? props[subresource['id']]['isOn'] : subresource['defaultOn']}
                            color='secondary'
                            onChange={props.handleLayerToggle.bind(this, subresource['id'])}
                            value={subresource['id']}
                          />
                        }
                        label={subresource['niceName']}
                      />
                    </FormGroup>
                    {(props[subresource['id']] ? props[subresource['id']]['isOn'] : subresource['defaultOn']) && 
                    <React.Fragment>
                      {subresource['legendUrl'] ? <img src={subresource['legendUrl']} alt='data legend' className={classNames(classes.img)}/> : ''}
                      <LevelSelector 
                        availableLevels={subresource['availableLevels']}
                        presentLevel={props[subresource['id']] ? props[subresource['id']]['level'] : null}
                      />
                    </React.Fragment>
                    }
                  </React.Fragment>
                )
              }
            })
          )
        } else {
          if (layer['visibleTOC']) {
            return (
              <FormGroup row={false}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={props[layer['id']] ? props[layer['id']]['isOn'] : layer['defaultOn']}
                      color='secondary'
                      onChange={props.handleLayerToggle.bind(this, layer['id'])}
                      value={layer['id']}
                    />
                  }
                  label={layer['niceName']}
                />
              </FormGroup>
            )
          }
        }
      })
    )
  }

  const categories = toc.map((category, indx) => {
    // check if visible TOC
    if (category['visibleTOC']) {
      return (
        <TOCExpansionPanel
          key = {indx.toString()}
          categoryName = {category['Category']}
          defaultExpanded = {category['expanded']}
        >
        {buildContents(toc[indx])}
        </TOCExpansionPanel>
      )}
    }
  )

  return (
    <React.Fragment>
      {categories}
    </React.Fragment>
  )
}

export default withStyles(styles, { withTheme: true })(TableOfContents);
