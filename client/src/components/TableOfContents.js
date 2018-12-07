import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
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

function TableOfContents(props) {
  const {toc, classes } = props;

  const buildContents = categoryObj => {
    return (
      categoryObj['Layers'].map((layer, indx) => {
        if ('subResources' in layer) {
          return (
            layer['subResources'].map((subresource, indx) => {
              if (subresource['visibleTOC']) {
                return (
                  <React.Fragment key={indx}>
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
                      {(props[subresource['id']] ? !isNaN(props[subresource['id']]['level']) : false) && 
                      <LevelSelector 
                        availableLevels={subresource['availableLevels']}
                        levelName={subresource['levelName']}
                        presentLevel={props[subresource['id']] ? props[subresource['id']]['level'] : null}
                        handleLevelChange={props.handleLevelChange}
                        id={subresource['id']}
                      />}
                    </React.Fragment>
                    }
                  </React.Fragment>
                )
              } else {
                return null
              }
            })
          )
        } else {
          if (layer['visibleTOC']) {
            return (
              <FormGroup key={indx} row={false}>
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
          } else {
            return null
          }
        }
      })
    )
  }

  const categories = toc.map((category, index) => {
    // check if visible TOC
    if (category['visibleTOC']) {
      return (
        <TOCExpansionPanel
          key = {index}
          categoryName = {category['Category']}
          defaultExpanded = {category['expanded']}
        >
        {buildContents(toc[index])}
        </TOCExpansionPanel>
      )} else {
        return null
      }
    }
  )

  return (
    <React.Fragment>
      {categories}
    </React.Fragment>
  )
}

export default withStyles(styles, { withTheme: true })(TableOfContents);
