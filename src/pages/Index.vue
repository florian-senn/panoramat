<template>
  <q-page class="flex flex-center">
    <v-pannellum
      :src="src"
      style="height: 80vh"
      :hfov.sync="hfov"
      :yaw.sync="yaw"
      :pitch.sync="pitch"
      compass
    />
    <q-btn
      @click="nextPanorama"
      :label="$t('next')"
    />
    <div class="row">
      <p class="col-12">
        Latitude: {{gps.latitude|round(6)}}
      </p>
      <p class="col-12">
        Longitude: {{gps.longitude|round(6)}}
      </p>
      <p class="col-12">
        Altitude: {{gps.altitude|round(0)}}
      </p>
    </div>
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
    <img id="exif" :src="src" hidden alt="Hidden image to extract EXIF from panorama."/>
  </q-page>
</template>

<script>
import VuePannellum from 'vue-pannellum'
import { parse } from 'exifr'
// import Xml from 'xml2js'
import { getPreciseDistance, getGreatCircleBearing } from 'geolib'

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
        'statics/panorama/panorama3.jpg'
      ],
      hfov: 120,
      pos: 0,
      yaw: 0,
      pitch: 0,
      coords: [{}],
      distances: [],
      bearings: []
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
    }
  },
  created () {
    let options = {
      exif: false,
      xmp: true,
      iptc: true,
      postProcess: true,
      mergeOutput: false
    }
    for (let source of this.sources) {
      console.log('Sources now')
      parse(source, options)
        .then(
          result => {
            this.gps.latitude = result.gps.latitude
            this.gps.longitude = result.gps.longitude
            this.gps.altitude = result.gps.GPSAltitude
            this.coords.push({
              latitude: result.gps.latitude,
              longitude: result.gps.longitude,
              altitude: result.gps.GPSAltitude
            })
          })
        .then(result => {
          for (let i in this.coords) {
            this.bearings[i] = getGreatCircleBearing(this.coords[i], this.coords[(i + 1) % this.coords.length])
            this.distances[i] = getPreciseDistance(this.coords[i], this.coords[(i + 1) % this.coords.length])
          }
        }
        )
        .catch(console.error)
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
