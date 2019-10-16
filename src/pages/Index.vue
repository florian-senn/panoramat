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
import { parse } from 'exifr'
// import Xml from 'xml2js'
import { getGreatCircleBearing, getPreciseDistance } from 'geolib'

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
          this.coords.push(results[i])
          bearings[i] = tempBearing
          distances[i] = tempDistance
          deltas[i] = tempDelta
          pitches[i] = tempPitch
        }
        this.results = {
          bearings: bearings,
          distances: distances,
          deltas: deltas,
          pitches: pitches
        }
      })
    function parseAsync (source) {
      let options = {
        exif: false,
        xmp: true,
        iptc: true,
        postProcess: true,
        mergeOutput: false
      }
      return new Promise(
        function (resolve, reject) {
          parse(source, options)
            .then(
              result => {
                resolve({ latitude: result.gps.latitude, longitude: result.gps.longitude, altitude: result.gps.GPSAltitude }
                )
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
