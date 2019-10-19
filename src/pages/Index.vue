<template>
  <q-page class="flex flex-center">
    <v-pannellum
      :src="src"
      style="height: 75vh"
      :hfov.sync="hfov"
      :yaw.sync="yaw"
      :pitch.sync="pitch"
      :hot-spots="hotSpots"
    />
    <q-btn
      @click="nextPanorama"
      :label="$t('next')"
    />
    <div class="q-pa-md">
      <q-badge>
        hfov: {{hfov|round}}
      </q-badge>
      <q-badge>
        pitch: {{pitch|round}}
      </q-badge>
      <q-badge>
        yaw: {{yaw|round}}
      </q-badge>
      <q-slider :step="0.1" label v-model="hfov" :min="30" :max="120"/>
      <q-slider :step="0.1" label v-model="pitch" :min="-90" :max="90"/>
      <q-slider :step="0.1" label v-model="yaw" :min="-180" :max="180"/>
    </div>
  </q-page>
</template>

<script>
import VuePannellum from 'vue-pannellum'
import { getGreatCircleBearing, getPreciseDistance } from 'geolib'
// import { retlog } from '../mixins/retlog'
import { parseText } from 'dji-xmetaparser'

export default {
  name: 'PageIndex',
  components: {
    'v-pannellum': VuePannellum
  },
  data () {
    return {
      sources: [
        'statics/panorama/panorama1.jpg',
        'statics/panorama/panorama2.jpg',
        'statics/panorama/panorama3.jpg',
        'statics/panorama/pan1.jpg',
        'statics/panorama/pan1.jpg',
        'statics/panorama/pan2.jpg',
        'statics/panorama/pan3.jpg',
        'statics/panorama/pan4.jpg',
        'statics/panorama/pan5.jpg'
      ],
      hfov: 120,
      pos: 0,
      yaw: 0,
      pitch: 0,
      coords: [],
      results: {
        bearings: [],
        distances: [],
        deltas: []
      }
    }
  },
  methods: {
    nextPanorama: function () {
      this.pos++
    }
  },
  computed: {
    src: function () {
      return this.sources[this.getPos]
    },
    getPos: function () {
      return this.pos % this.sources.length
    },
    gps: function () {
      return this.coords[this.getPos]
    },
    hotSpots: function () {
      let result = []
      let results = this.results
      let getPos = this.getPos
      for (let bearing in results['bearings']) {
        if (parseInt(bearing) !== parseInt(getPos)) {
          result.push({
            pitch: results['pitches'][getPos][bearing],
            yaw: results['bearings'][getPos][bearing],
            type: 'info',
            text: getPos + ' to ' + bearing
          })
        }
      }
      return result
    }
  },
  mounted () {
    const results = this.sources.map(parseAsync)
    Promise.all(results)
      .then(results => {
        let bearings = []
        let distances = []
        let deltas = []
        let pitches = []
        for (let i in results) {
          let tempBearing = []
          let tempDistance = []
          let tempDelta = []
          let tempPitch = []
          for (let k in results) {
            tempBearing[k] = getGreatCircleBearing(results[i], results[k])
            tempDistance[k] = getPreciseDistance(results[i], results[k])
            tempDelta[k] = results[k].altitude - results[i].altitude
            if (i !== k) {
              tempPitch[k] = Math.atan(tempDelta[k] / tempDistance[k]) * 180 / Math.PI
            } else {
              tempPitch[k] = 0
            }
          }
          bearings[i] = tempBearing
          distances[i] = tempDistance
          deltas[i] = tempDelta
          pitches[i] = tempPitch
        }
        let acc = {}
        for (const result of results) {
          acc[Object.keys(result)[0]] = result[Object.keys(result)[0]]
        }
        this.coords = acc
        this.results = {
          bearings: bearings,
          distances: distances,
          deltas: deltas,
          pitches: pitches
        }
      })
      .catch()
    function parseAsync (source) {
      return new Promise(
        function (resolve, reject) {
          fetch(source)
            .then(response => response.blob())
            .then(blob => blob.text())
            .then(text => parseText(text))
            .then(data => {
              resolve({ [source]: {
                gps: {
                  latitude: data['droneDji']['gpsLatitude'],
                  longitude: data['droneDji']['gpsLongitude'],
                  altitude: data['droneDji']['absoluteAltitude']
                },
                gimbal: {
                  pitch: data['droneDji']['gimbalPitchDegree'],
                  yaw: data['droneDji']['gimbalYawDegree'],
                  roll: data['droneDji']['gimbalRollDegree']
                }
              }
              })
            })
            .catch()
        }
      )
    }
  },
  filters: {
    round: function (value, count = 1) {
      if (!value) return '0.0'
      return value.toFixed(count)
    }
  }
}
</script>
