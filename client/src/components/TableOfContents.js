import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TOCExpansionPanel from './TOCExpansionPanel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import LevelSelector from './LevelSelector';
import DynamicLegend from './DynamicLegend';
import LegendContainer from './LegendContainer';
import LoadingSpinner from './LoadingSpinner';
import SettingsCog from './SettingsCog';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
library.add(faExclamationTriangle);

// https://stackoverflow.com/questions/35905988/react-js-how-to-append-a-component-on-click

const styles = theme => ({
  img: {
    width: '100%',
  },
  timeInfo: {
    lineHeight: '1.6',
    fontSize: '.65rem'
  }
});

function TableOfContents(props) {
  const {toc } = props;

  const constructLabel = (labelText, layerID, includeSettings) => (
    <React.Fragment>
      {(props['mapLayers'][layerID] ? 
        props['mapLayers'][layerID]['isLoading'] : false) && <LoadingSpinner />}
      {labelText}
      {(props['mapLayers'][layerID]['loadError'] && !props['mapLayers'][layerID]['isLoading'] && 
        props['mapLayers'][layerID]['isOn']) && 
        <FontAwesomeIcon 
          icon="exclamation-triangle" 
          title={'Failed to load layer!'} 
          style={{color: 'red', marginLeft: 5, fontSize: '1.2em'}} 
        />
      }
      {(includeSettings && !props['mapLayers'][layerID]['isLoading'] &&  props['mapLayers'][layerID]['isOn']) && 
        <SettingsCog
          layerID = {layerID} 
          handleSettingsPanelVisibility = {props.handleSettingsPanelVisibility}
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
                            checked={props['mapLayers'][subresource['id']]['isOn']}
                            color='secondary'
                            onChange={props.handleLayerToggle.bind(this, subresource['id'])}
                            value={subresource['id']}
                          />
                        }
                        label={constructLabel(subresource['niceName'], subresource['id'], true)}
                      />
                    </FormGroup>
                    {(props['mapLayers'][subresource['id']]['isOn'] && !props['mapLayers'][subresource['id']]['isLoading'] &&
                     !props['mapLayers'][subresource['id']]['loadError']) && 
                    <React.Fragment>
                       <Typography variant="overline" classes={{overline: props.classes['timeInfo']}}>
                        Date Valid: {props['mapLayers'][subresource['id']]['validTime']}
                      </Typography>
                      <Typography variant="overline" classes={{overline: props.classes['timeInfo']}} gutterBottom>
                        Model Initialized: {props['mapLayers'][subresource['id']]['initTime']}
                      </Typography>
                      {subresource['legendUrl'] && 
                        <DynamicLegend 
                          layer={props['mapLayers'][subresource['id']]}
                          legendUrl={subresource['legendUrl']}
                      />}
                      {!isNaN(props['mapLayers'][subresource['id']]['level']) && 
                      <LevelSelector 
                        availableLevels={subresource['availableLevels']}
                        levelName={subresource['levelName']}
                        presentLevel={props['mapLayers'][subresource['id']]['level']}
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
              <React.Fragment key={indx}>
                <FormGroup key={indx} row={false}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={props['mapLayers'][layer['id']]['isOn']}
                        color='secondary'
                        onChange={props.handleLayerToggle.bind(this, layer['id'])}
                        value={layer['id']}
                      />
                    }
                    label={constructLabel(layer['niceName'], layer['id'], false)}
                  />
                </FormGroup>
                {(props['mapLayers'][layer['id']]['isOn'] && props['mapLayers'][layer['id']]['nowCoastDataset']
                  && !props['mapLayers'][layer['id']]['isLoading'] && !props['mapLayers'][layer['id']]['loadError']) && 
                  <React.Fragment>
                    <Typography variant="overline" gutterBottom>
                      {props['mapLayers'][layer['id']]['prodTime'] ? 
                      `${props['mapLayers'][layer['id']]['prodTimeLabel']}: ${props['mapLayers'][layer['id']]['prodTime'] || ''}` : ''}
                    </Typography>
                    <LegendContainer>
                       <div dangerouslySetInnerHTML={{__html: props['mapLayers'][layer['id']]['legendContent']}} />
                    </LegendContainer>
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
    if (category['Category'] === 'MetOcean' && !props['initializedLayers']) {
      return null
    }

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
