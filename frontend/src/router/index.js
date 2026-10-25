import { createRouter, createWebHashHistory } from 'vue-router'
import WelcomeScreen     from '../screens/WelcomeScreen.vue'
import QrScanScreen     from '../screens/QrScanScreen.vue'
import AwakeningScreen  from '../screens/AwakeningScreen.vue'
import ShareCardScreen  from '../screens/ShareCardScreen.vue'
import CouponScreen     from '../screens/CouponScreen.vue'
import BuddyChatScreen  from '../screens/BuddyChatScreen.vue'
import DashboardScreen  from '../screens/DashboardScreen.vue'
import QrAdminScreen    from '../screens/QrAdminScreen.vue'
import FieldMarkersScreen from '../screens/FieldMarkersScreen.vue'
import MapScreen        from '../screens/MapScreen.vue'
import LocationScreen   from '../screens/LocationScreen.vue'
import MiniGameScreen   from '../screens/MiniGameScreen.vue'
import BuddyMeetScreen  from '../screens/BuddyMeetScreen.vue'
import CompleteScreen   from '../screens/CompleteScreen.vue'
import CollectionScreen from '../screens/CollectionScreen.vue'
import BuddyDetailScreen from '../screens/BuddyDetailScreen.vue'
import RecordScreen     from '../screens/RecordScreen.vue'
import EndingScreen     from '../screens/EndingScreen.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',                      component: WelcomeScreen },
    { path: '/map',                   component: MapScreen },
    { path: '/location/:id',          component: LocationScreen },
    { path: '/minigame/:locationId',  component: MiniGameScreen },
    { path: '/meet/:buddyId',         component: BuddyMeetScreen },
    { path: '/complete',              component: CompleteScreen },
    { path: '/collection',            component: CollectionScreen },
    { path: '/buddy/:id',             component: BuddyDetailScreen },
    { path: '/record',                component: RecordScreen },
    { path: '/ending',                component: EndingScreen },
    { path: '/qrscan',               component: QrScanScreen },
    { path: '/awakening/:buddyId',   component: AwakeningScreen },
    { path: '/share/:buddyId',       component: ShareCardScreen },
    { path: '/coupon/:locationId',   component: CouponScreen },
    { path: '/chat/:buddyId',        component: BuddyChatScreen },
    { path: '/dashboard',            component: DashboardScreen },
    { path: '/qr-admin',             component: QrAdminScreen },
    { path: '/field-markers',        component: FieldMarkersScreen },
  ],
})
