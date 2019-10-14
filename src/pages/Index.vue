<template>
  <q-page class="flex flex-center">
    <v-pannellum
      :src="src"
      style="height: 90vh"
      :hfov.sync="hfov"
      :yaw.sync="yaw"
      :pitch.sync="pitch"
    />
    <q-btn
      @click="pos++"
      :label="$t('next')"
    />
  </q-page>
</template>

<script>
import VuePannellum from 'vue-pannellum'

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
      pos: 0,
      hfov: 120,
      yaw: 0,
      pitch: 0
    }
  },
  computed: {
    src: function () {
      return this.sources[this.pos % this.sources.length]
    }
  }
}
</script>
