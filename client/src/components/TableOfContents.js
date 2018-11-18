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


// https://stackoverflow.com/questions/35905988/react-js-how-to-append-a-component-on-click

const styles = theme => ({});

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
  const {toc, ...other} = props;
  console.log(toc)

  const buildContents = categoryObj => {
    return (
      categoryObj['Layers'].map((layer, indx) => {
        if ('subResources' in layer) {
          return (
            layer['subResources'].map((subresource, indx) => {
              if (subresource['visibleTOC']) {
                return (
                  <FormGroup row={false}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={props[subresource['id']] ? props[subresource['id']]['isOn'] : false}
                          color='secondary'
                          onChange={props.handleLayerToggle.bind(this, subresource['id'])}
                          value={subresource['id']}
                        />
                      }
                      label={subresource['niceName']}
                    />
                  </FormGroup>
                )
              }
            })
          )
        } else {
          return (
            <FormGroup row={false}>
              <FormControlLabel
                control={
                  <Switch
                    // checked={layer['defaultOn']}
                    color='secondary'
                    onChange={()=> console.log('changed!')}
                    value="checkedA"
                  />
                }
                label={layer['niceName']}
              />
            </FormGroup>
          )
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
