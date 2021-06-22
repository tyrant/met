import React from 'react';
import logo from './logo.svg';
import './App.css';
import * as d3 from 'd3';
import * as json from './data.json';
import { Scatter } from 'react-chartjs-2';
import 'chartjs-adapter-moment';
import { Container, Row, Col } from 'react-bootstrap';
import { cloneDeep } from 'lodash';


class App extends React.Component<any, any> {

  constructor(props: any) {
    super(props);

    this.state = { 
      waveSigHeightData: [],
      airTempData: [],
      windDirData: [],
      windSpeedData: [],
      spectralDensityData: [],
      seawaterSpeedData: [],
      waveMaxHeightData: [],
    };

    fetch('http://localhost:3000/data.json')
      .then(res => res.json()).then(jsonData => {

      let spectralDensityData = {
        datasets: [{
            label: 'Sea surface wave from direction at variance spectral density maximum',
            data: Object.keys(jsonData).map((datetime, i) => {
              let datum = jsonData[datetime];
              return {
                x: Date.parse(datetime),
                y: datum.sea_surface_wave_from_direction_at_variance_spectral_density_maximum || null
              };
            }).filter(d => d.y != null),
            backgroundColor: 'rgba(50, 230, 90, 1)',
            showLine: true
          }]
      };

      // The seawater data needs a bit more processing: if you take
      // a look at its overall JSON file, you'll see there are a few
      // extra entries for just seawater speed - and they're out of 
      // chronological order. Do one final sort-by-date before graphing.
      let seawaterSpeedData = {
        datasets: [{
            label: 'Sea sea water speed',
            data: Object.keys(jsonData).map((datetime, i) => {
              let datum = jsonData[datetime];
              return {
                x: Date.parse(datetime),
                y: datum.surface_sea_water_speed || null
              };
            }).filter(d => d.y != null).sort((a, b) => a.x - b.x),
            backgroundColor: 'rgba(200, 80, 120, 1)',
            showLine: true
          }]
      };

      let waveMaxHeightData = {
        datasets: [{
            label: 'Sea surface wave _maximum_ height (m)',
            data: Object.keys(jsonData).map((datetime, i) => {
              let datum = jsonData[datetime];
              return {
                x: Date.parse(datetime),
                y: datum.sea_surface_wave_maximum_height || null
              };
            }).filter(d => d.y != null),
            backgroundColor: 'rgba(20, 100, 200, 1)',
            showLine: true
          }]
      };

      this.setState({ spectralDensityData, seawaterSpeedData, waveMaxHeightData });
    });



    d3.csv('http://localhost:3000/data.csv').then(csvData => {

      let waveSigHeightData = {
        datasets: [{
            label: 'Sea surface wave _significant_ height (m)',
            data: csvData.map(datum => { 
              return { 
                x: Date.parse(datum.datetime), 
                y: parseFloat(datum.sea_surface_wave_significant_height)
              };
            }).filter(datum => !isNaN(datum.y)),
            backgroundColor: 'rgba(255, 0, 0, 1)',
            showLine: true
          }]
      };
      let airTempData = {
        datasets: [{
            label: 'Air temperature at 2m above ground level (K)',
            data: csvData.map(datum => { 
              return { 
                x: Date.parse(datum.datetime), 
                y: parseFloat(datum.air_temperature_at_2m_above_ground_level)
              };
            }),
            backgroundColor: 'rgba(0, 255, 0, 1)',
            showLine: true
          }]
      };

      // I've added an extremely clumsy second map() usage: the x-axis data is a
      // compass bearing, so it's got modulo-360. Doesn't really make sense to just
      // simply do a bearing-versus-time plot, because if two neighbouring readings 
      // straddle north, 000, then a simple x-y plot would place them almost 360
      // degrees apart. That ain't right. Let's add 360 degrees to the lowest-value
      // bearings and also adjust the x-axis labels, to put the north-straddling
      // bearings next to each other.
      let windDirData = {
        datasets: [{
            label: 'Wind direction 10m above ground (compass bearing)',
            data: csvData.map(datum => { 
              return { 
                x: Date.parse(datum.datetime), 
                y: parseFloat(datum.wind_from_direction_at_10m_above_ground_level)
              };
            }).map(datum => {
              return {
                x: datum.x,
                y: (datum.y < 100) ? (datum.y + 360) : datum.y
              };
            }),
            backgroundColor: 'rgba(0, 0, 0, 1)',
            showLine: true
          }]
      };

      let windSpeedData = {
        datasets: [{
            label: 'Wind speed at 10m above ground level',
            data: csvData.map(datum => { 
              return { 
                x: Date.parse(datum.datetime), 
                y: parseFloat(datum.wind_speed_at_10m_above_ground_level)
              };
            }),
            backgroundColor: 'rgba(0, 0, 255, 1)',
            showLine: true
          }]
      };

      this.setState({ waveSigHeightData, airTempData, windDirData, windSpeedData });
    });
  }

  render() {
    const { 
      waveSigHeightData, 
      airTempData, 
      windDirData, 
      windSpeedData, 
      spectralDensityData, 
      seawaterSpeedData, 
      waveMaxHeightData 
    } = this.state;

    let scatterOptions = {
      responsive: true,
      scales: {
        y: { 
          type: 'linear',
          position: 'left',
        },
        xAxes: { 
          type: 'time'
        },
      }
    };

    // Let's do a bit more tweaking to our wind direction compass bearings.
    let windDirOptions = cloneDeep(scatterOptions);
    windDirOptions.scales.y.ticks = {
      callback: (value, _index, _values) => value % 360,
      stepSize: 30,
    };

    return (
      <div className="App">
        <Container>
          <Row><Col><h1>JSON data plots</h1></Col></Row>
          <Row>
            <Col lg={6}>
              <Scatter type="scatter" data={spectralDensityData} options={scatterOptions} />
            </Col>
            <Col lg={6}>
              <Scatter type="scatter" data={seawaterSpeedData} options={scatterOptions} />
            </Col>
          </Row>
          <Row>
            <Col lg={6}>
              <Scatter type="scatter" data={waveMaxHeightData} options={scatterOptions} />
            </Col>
            <Col lg={6}>

            </Col>
          </Row>
          <Row><Col><h1>CSV data plots</h1></Col></Row>
          <Row>
            <Col lg={6}>
              <Scatter type="scatter" data={waveSigHeightData} options={scatterOptions} />
            </Col>
            <Col lg={6}>
              <Scatter type="scatter" data={airTempData} options={scatterOptions} />
            </Col>
          </Row>
          <Row>
            <Col lg={6}>
              <Scatter type="scatter" data={windDirData} options={windDirOptions} />
            </Col>
            <Col lg={6}>
              <Scatter type="scatter" data={windSpeedData} options={scatterOptions} />
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default App;
