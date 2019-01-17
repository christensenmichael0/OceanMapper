import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TOCExpansionPanel from './TOCExpansionPanel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import LevelSelector from './LevelSelector';
import LoadingSpinner from './LoadingSpinner';

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
library.add(faExclamationTriangle);

// label={<LoadingSpinner />subresource['niceName']}

// https://stackoverflow.com/questions/35905988/react-js-how-to-append-a-component-on-click

const styles = theme => ({
  img: {
    width: '100%',
  },
});

// TODO add some logic for error loading a layer.. i.e. probably don't show legend or date valid

function TableOfContents(props) {
  const {toc, classes } = props;

  const constructLabel = (labelText, layerID) => (
    <React.Fragment>
      {(props['mapLayers'][layerID] ? 
        props['mapLayers'][layerID]['isLoading'] : false) && <LoadingSpinner />}
      {labelText}
      {(props['mapLayers'][layerID] && props['mapLayers'][layerID]['loadError'] && !props['mapLayers'][layerID]['isLoading'] && 
        props['mapLayers'][layerID]['isOn']) && 
        <FontAwesomeIcon 
          icon="exclamation-triangle" 
          title={'Failed to load layer!'} 
          style={{color: 'red', marginLeft: 5, fontSize: '1.2em'}} 
        />
      }
    </React.Fragment>
  )

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
                            checked={props['mapLayers'][subresource['id']] ? 
                              props['mapLayers'][subresource['id']]['isOn'] : subresource['defaultOn']}
                            color='secondary'
                            onChange={props.handleLayerToggle.bind(this, subresource['id'])}
                            value={subresource['id']}
                          />
                        }
                        label={constructLabel(subresource['niceName'], subresource['id'])}
                      />
                    </FormGroup>
                    {((props['mapLayers'][subresource['id']] ? props['mapLayers'][subresource['id']]['isOn'] : subresource['defaultOn']) 
                      && !props['mapLayers'][subresource['id']]['isLoading'] && !props['mapLayers'][subresource['id']]['loadError']) && 
                    <React.Fragment>
                       <Typography variant="overline" gutterBottom>
                        Date Valid: {props['mapLayers'][subresource['id']] ? props['mapLayers'][subresource['id']]['validTime'] : ''}
                      </Typography>
                      {subresource['legendUrl'] ? <img src={subresource['legendUrl']} alt='data-legend' className={classNames(classes.img)}/> : ''}
                      {(props['mapLayers'][subresource['id']] ? !isNaN(props['mapLayers'][subresource['id']]['level']) : false) && 
                      <LevelSelector 
                        availableLevels={subresource['availableLevels']}
                        levelName={subresource['levelName']}
                        presentLevel={props['mapLayers'][subresource['id']] ? props['mapLayers'][subresource['id']]['level'] : null}
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
              <React.Fragment>
                <FormGroup key={indx} row={false}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={props['mapLayers'][layer['id']] ? props['mapLayers'][layer['id']]['isOn'] : layer['defaultOn']}
                        color='secondary'
                        onChange={props.handleLayerToggle.bind(this, layer['id'])}
                        value={layer['id']}
                      />
                    }
                    label={constructLabel(layer['niceName'], layer['id'])}
                  />
                </FormGroup>
                {(props['mapLayers'][layer['id']]['isOn'] && props['mapLayers'][layer['id']]['nowCoastDataset']
                  && !props['mapLayers'][layer['id']]['isLoading'] && !props['mapLayers'][layer['id']]['loadError']) && 
                  <React.Fragment>
                    <Typography variant="overline" gutterBottom>
                      {props['mapLayers'][layer['id']]['prodTime'] ? 
                      `${props['mapLayers'][layer['id']]['prodTimeLabel']}: ${props['mapLayers'][layer['id']]['prodTime'] || ''}` : ''}
                    </Typography>
                  </React.Fragment>
                }
              </React.Fragment>
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
