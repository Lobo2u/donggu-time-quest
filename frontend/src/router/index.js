import { createRouter, createWebHashHistory } from 'vue-router'
import WelcomeScreen from '../screens/WelcomeScreen.vue'
import MapScreen from '../screens/MapScreen.vue'
import FieldScreen from '../screens/FieldScreen.vue'
import CompleteScreen from '../screens/CompleteScreen.vue'
import CollectionScreen from '../screens/CollectionScreen.vue'
import EndingScreen from '../screens/EndingScreen.vue'
import RecordScreen from '../screens/RecordScreen.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',           component: WelcomeScreen },
    { path: '/map',        component: MapScreen },
    { path: '/field',      component: FieldScreen },
    { path: '/complete',   component: CompleteScreen },
    { path: '/collection', component: CollectionScreen },
    { path: '/ending',     component: EndingScreen },
    { path: '/record',     component: RecordScreen },
  ],
})
