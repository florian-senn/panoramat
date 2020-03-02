<template>
  <q-page class="flex flex-center">
    <v-pannellum
      :src="src"
      style="height: calc(100vh - 50px)"
      :hfov.sync="hfov"
      :yaw.sync="yaw"
      :pitch.sync="pitch"
      :hot-spots="hotSpots"
      compass
      :northOffset="offset"
    />
    <div style="background-color: white; position: absolute; left: 0; bottom: 0; ">
      <q-btn
        @click="prevPanorama"
        :label="$t('previous')"
      />
      <q-btn
        @click="nextPanorama"
        :label="$t('next')"
      />
      <div class="q-pa-md">
        <q-badge>
          {{$t('hfov')}}: {{hfov|round}}
        </q-badge>
        <q-slider :step="0.1" label v-model="hfov" :min="30" :max="120"/>
        <q-badge>
          {{$t('pitch')}}: {{pitch|round}}
        </q-badge>
        <q-slider :step="0.1" label v-model="pitch" :min="-90" :max="90"/>
        <q-badge>
          {{$t('yaw')}}: {{yaw|round}}
        </q-badge>
        <q-slider :step="0.1" label v-model="yaw" :min="-180" :max="180"/>
        <q-badge>
          {{$t('resolution')}}: {{resolution}}
        </q-badge>
        <q-slider :step="0.1" label v-model="resolution" :min="0.2" :max="1"/>
        <q-badge>
          {{$t('quality')}}: {{quality}}
        </q-badge>
        <q-slider :step="10" label v-model="quality" :min="30" :max="100"/>
      </div>
    </div>
  </q-page>
</template>

<script>
import VuePannellum from '@fsenn/vue-pannellum'
import { getGreatCircleBearing, getPreciseDistance } from 'geolib'
import * as Exifr from 'exifr'
import * as Xml from 'xml2js'

const imgixBaseUrl = 'https://panoramat.imgix.net/'

// eslint-disable-next-line no-extend-native
Number.prototype.mod = (n) => {
  return ((this % n) + n) % n
}

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
        'statics/panorama/pan5.jpg',
        'statics/panorama/pano1.jpg',
        'statics/panorama/pano2.jpg'
      ],
      hfov: 120,
      pos: 0,
      yaw: 0,
      pitch: 0,
      coords: {},
      results: {
        bearings: {},
        distances: {},
        deltas: {}
      },
      resolution: 0.5,
      quality: 75,
      suffix: '?auto=compress,format'
    }
  },
  methods: {
    prevPanorama () {
      this.pos--
    },
    nextPanorama () {
      this.pos++
    },
    srcToImgix (source, suffix) {
      return imgixBaseUrl + source + suffix + '&w=' + this.resolution + '&q=' + this.quality
    }
  },
  computed: {
    src () {
      return this.srcToImgix(this.rawSrc, this.suffix)
    },
    rawSrc () {
      return this.sources[this.getPos]
    },
    getPos () {
      return (this.pos.mod(this.sources.length))
    },
    gps () {
      return this.coords[this.getPos]
    },
    hotSpots () {
      let result = []
      let results = this.results
      let src = this.rawSrc
      for (let target in results['bearings']) {
        if (target !== src) {
          result.push({
            pitch: results['pitches'][src][target],
            yaw: (results['bearings'][src][target] - this.coords[src].gimbal.yaw) + this.offset,
            type: 'info',
            text: src + ' to ' + target
          })
        }
      }
      if (this.coords[src]) {
        result.push(({
          pitch: 0,
          yaw: (-this.coords[src].gimbal.yaw),
          type: 'info',
          text: 'Norden'
        }))
      }
      return result
    },
    northOffset () {
      return 0
    }
  },
  mounted () {
    let parseAsync = source => {
      return Exifr.parse(source, { xmp: true, tiff: false })
        .then(xml => Xml.parseStringPromise(xml.xmp))
        .then(json => json['x:xmpmeta']['rdf:RDF'][0]['rdf:Description'][0]['$'])
        .then(data => {
          return {
            [source]: {
              gps: {
                latitude: Number(data['drone-dji:GpsLatitude']),
                longitude: Number(data['drone-dji:GpsLongitude']),
                altitude: Number(data['drone-dji:AbsoluteAltitude'])
              },
              gimbal: {
                pitch: Number(data['drone-dji:GimbalPitchDegree']),
                yaw: Number(data['drone-dji:GimbalYawDegree']),
                roll: Number(data['drone-dji:GimbalRollDegree'])
              }
            }
          }
        })
        .catch()
    }
    const results = this.sources.map(parseAsync)
    Promise.all(results)
      .then(results => {
        let acc = {}
        for (const result of results) {
          acc[Object.keys(result)[0]] = result[Object.keys(result)[0]]
        }
        this.coords = acc
        results = acc
        let bearings = {}
        let distances = {}
        let deltas = {}
        let pitches = {}
        for (let i in results) {
          let tempBearing = {}
          let tempDistance = {}
          let tempDelta = {}
          let tempPitch = {}
          for (let k in results) {
            tempBearing[k] = getGreatCircleBearing(results[i].gps, results[k].gps)
            tempDistance[k] = getPreciseDistance(results[i].gps, results[k].gps)
            tempDelta[k] = results[k].gps.altitude - results[i].gps.altitude
            if (i !== k) {
              tempPitch[k] = Math.atan(tempDelta[k] / tempDistance[k]) / ((Math.PI / 180))
            } else {
              tempPitch[k] = 0
            }
          }
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
      .catch()
  },
  filters: {
    round (value, count = 1) {
      if (!value) return '0.0'
      return value.toFixed(count)
    }
  }
}
</script>
