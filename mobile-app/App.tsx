import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  Image,
  Vibration,
  Platform,
  AppState,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Pusher from 'pusher-js';

// ==========================================
// CONSTANTS & SOUND ASSETS
// ==========================================
const PUSHER_KEY = '1f774a5bbab3fae7abac';
const PUSHER_CLUSTER = 'ap2';
const PUSHER_CHANNEL = 'admin-notifications';

const SOUND_URLS = {
  cartAdded: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Soft chime ping
  checkoutEntered: 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3', // Distinct "ling" alert
  newOrder: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Loud cash-register celebration
};

// Available order statuses in database
const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// Helper to base64 encode strings reliably in React Native Hermes
function simpleBase64(str: string): string {
  if (typeof btoa === 'function') {
    try {
      return btoa(str);
    } catch (_) {}
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let block = 0, charCode, i = 0, map = chars;
       str.charAt(i | 0) || (map = '=', i % 1);
       output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3/4);
    block = block << 8 | charCode;
  }
  return output;
}

export default function App() {
  // Session & Config state
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState<string>('https://www.shanfaglobal.com');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'events' | 'settings'>('dashboard');

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  // Live visitor events stream
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [pusherConnected, setPusherConnected] = useState<boolean>(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);

  // In-App Heads-up Instant Alert Toast
  const [toastBanner, setToastBanner] = useState<{
    id: string;
    type: 'cartAdded' | 'checkoutEntered' | 'newOrder';
    title: string;
    message: string;
  } | null>(null);
  const toastAnim = useRef(new Animated.Value(-150)).current;
  const toastTimeoutRef = useRef<any>(null);

  // Sound references
  const soundsRef = useRef<{ [key: string]: Audio.Sound }>({});

  const showNotificationToast = (
    type: 'cartAdded' | 'checkoutEntered' | 'newOrder',
    title: string,
    message: string
  ) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastBanner({ id: String(Date.now()), type, title, message });

    Animated.spring(toastAnim, {
      toValue: Platform.OS === 'ios' ? 44 : 20,
      useNativeDriver: true,
      friction: 7,
      tension: 40,
    }).start();

    toastTimeoutRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToastBanner(null));
    }, 5000);
  };

  // ------------------------------------------
  // AUDIO & NOTIFICATION ENGINE
  // ------------------------------------------
  useEffect(() => {
    async function initAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false, // Don't duck, play immediately at full volume!
          playThroughEarpieceAndroid: false,
        });

        // Preload sounds for instant zero-latency playback
        const [cartRes, checkoutRes, orderRes] = await Promise.allSettled([
          Audio.Sound.createAsync({ uri: SOUND_URLS.cartAdded }, { shouldPlay: false, volume: 1.0 }),
          Audio.Sound.createAsync({ uri: SOUND_URLS.checkoutEntered }, { shouldPlay: false, volume: 1.0 }),
          Audio.Sound.createAsync({ uri: SOUND_URLS.newOrder }, { shouldPlay: false, volume: 1.0 }),
        ]);

        if (cartRes.status === 'fulfilled') soundsRef.current.cartAdded = cartRes.value.sound;
        if (checkoutRes.status === 'fulfilled') soundsRef.current.checkoutEntered = checkoutRes.value.sound;
        if (orderRes.status === 'fulfilled') soundsRef.current.newOrder = orderRes.value.sound;
      } catch (e) {
        console.log('Audio init error:', e);
      }
    }

    initAudio();

    return () => {
      Object.values(soundsRef.current).forEach((snd) => {
        try {
          snd.unloadAsync();
        } catch (_) {}
      });
    };
  }, []);

  const triggerAlertSound = async (type: 'cartAdded' | 'checkoutEntered' | 'newOrder') => {
    // 1. Instant tactile feedback (0ms latency, runs immediately in parallel)
    if (vibrationEnabled) {
      if (type === 'newOrder') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Vibration.vibrate([0, 150, 100, 250, 100, 400]);
      } else if (type === 'checkoutEntered') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        Vibration.vibrate(180);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        Vibration.vibrate(80);
      }
    }

    if (!soundEnabled) return;

    // 2. Play sound with 0ms latency
    try {
      const soundObj = soundsRef.current[type];
      if (soundObj) {
        await soundObj.stopAsync().catch(() => {});
        await soundObj.setPositionAsync(0).catch(() => {});
        await soundObj.setVolumeAsync(1.0).catch(() => {});
        await soundObj.playAsync().catch(() => {});
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: SOUND_URLS[type] },
          { shouldPlay: true, volume: 1.0 }
        );
        soundsRef.current[type] = sound;
      }
    } catch (e) {
      console.log('Audio play error:', e);
    }
  };

  // ------------------------------------------
  // REST CLIENT (BEARER AUTHENTICATED)
  // ------------------------------------------
  const apiCall = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const url = `${baseUrl.replace(/\/+$/, '')}${path}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
          // Token expired or invalid
          handleLogout();
          throw new Error('Unauthorized. Please log in again.');
        }
        return await response.json();
      } catch (err: any) {
        throw err;
      }
    },
    [baseUrl, token]
  );

  // ------------------------------------------
  // INITIALIZE SESSION FROM ASYNCSTORAGE
  // ------------------------------------------
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const savedBaseUrl = await AsyncStorage.getItem('SHANFA_BASE_URL');
        if (savedBaseUrl) setBaseUrl(savedBaseUrl);

        const savedToken = await AsyncStorage.getItem('SHANFA_AUTH_TOKEN');
        const savedUser = await AsyncStorage.getItem('SHANFA_ADMIN_USER');

        if (savedToken) {
          setToken(savedToken);
          if (savedUser) setAdminUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.log('Storage loading error:', err);
      } finally {
        setIsInitializing(false);
      }
    }

    loadStoredAuth();
  }, []);

  // ------------------------------------------
  // PUSHER REAL-TIME WEBSOCKET SUBSCRIPTION
  // ------------------------------------------
  useEffect(() => {
    if (!token) return;

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
      activityTimeout: 10000, // 10s active heartbeat ping
      pongTimeout: 4000,      // 4s pong timeout to detect drop immediately
      enableStats: false,
    });

    pusher.connection.bind('connected', () => {
      console.log('⚡ Pusher WebSocket is ACTIVE & CONNECTED');
      setPusherConnected(true);
    });
    pusher.connection.bind('connecting', () => {
      console.log('Pusher connecting...');
    });
    pusher.connection.bind('disconnected', () => {
      setPusherConnected(false);
      setTimeout(() => pusher.connect(), 500);
    });
    pusher.connection.bind('unavailable', () => {
      setPusherConnected(false);
      setTimeout(() => pusher.connect(), 500);
    });
    pusher.connection.bind('error', () => {
      setPusherConnected(false);
      setTimeout(() => pusher.connect(), 1000);
    });

    // Handle AppState (when admin returns to app or wakes screen)
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        if (pusher.connection.state !== 'connected') {
          pusher.connect();
        }
      }
    });

    // Active heartbeat check every 12 seconds
    const heartbeat = setInterval(() => {
      if (pusher.connection.state !== 'connected') {
        pusher.connect();
      }
    }, 12000);

    const channel = pusher.subscribe(PUSHER_CHANNEL);

    // 1. User added product to cart (Instant ping sound + heads-up toast)
    channel.bind('cart-added', (data: any) => {
      triggerAlertSound('cartAdded');
      const prodName = data.productName || data.name || 'Product';
      const qty = data.quantity || 1;
      const price = data.price || 0;
      const currency = data.currency || 'AED';

      showNotificationToast(
        'cartAdded',
        '🛒 Cart Notification',
        `Customer added "${prodName}" (${qty}x) • ${currency} ${price}`
      );

      const newEvent = {
        id: `cart-${Date.now()}`,
        type: 'cart-added',
        title: 'Product Added to Cart',
        message: `${prodName} added (${qty}x) • ${currency} ${price}`,
        price,
        currency,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
    });

    // 2. User opened checkout page (Instant "ling" sound + heads-up toast)
    channel.bind('checkout-entered', (data: any) => {
      triggerAlertSound('checkoutEntered');
      const count = data.itemCount || 1;
      const amount = data.totalAmount ?? data.total ?? 0;
      const currency = data.currency || 'AED';

      showNotificationToast(
        'checkoutEntered',
        '⚡ Checkout Alert',
        `Customer is on Checkout with ${count} items • Total: ${currency} ${amount}`
      );

      const newEvent = {
        id: `checkout-${Date.now()}`,
        type: 'checkout-entered',
        title: 'Customer at Checkout',
        message: `${count} item(s) • ${currency} ${amount} (Ready to purchase)`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
    });

    // 3. New Order completed (Instant celebration sound + heavy vibration + heads-up toast)
    channel.bind('new-order', (data: any) => {
      triggerAlertSound('newOrder');
      const ordNum = data.orderNumber || data.id || 'NEW';
      const cust = data.customerName || data.userName || 'Customer';
      const amount = data.amount ?? data.total ?? 0;
      const currency = data.currency || 'AED';
      const method = data.paymentMethod || 'Confirmed';

      showNotificationToast(
        'newOrder',
        `🎉 NEW ORDER #${ordNum}!`,
        `${cust} placed order for ${currency} ${amount} (${method})`
      );

      const newEvent = {
        id: `order-${Date.now()}`,
        type: 'new-order',
        title: `NEW ORDER #${ordNum}!`,
        message: `${cust} • ${currency} ${amount} (${method})`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)]);

      // Instantly refresh live DB metrics and orders list
      fetchDashboardData();
      fetchOrdersData();
    });

    return () => {
      clearInterval(heartbeat);
      appStateSub.remove();
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [token, soundEnabled, vibrationEnabled, fetchDashboardData, fetchOrdersData]);

  // ------------------------------------------
  // DATA FETCHING (NO DUMMY DATA)
  // ------------------------------------------
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setIsDashboardLoading(true);
    try {
      const res = await apiCall('/api/admin/mobile/dashboard');
      if (res.success) {
        setDashboardData(res);
      }
    } catch (e: any) {
      console.log('Dashboard fetch error:', e.message);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [token, apiCall]);

  const fetchOrdersData = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const url = orderStatusFilter === 'ALL'
        ? '/api/admin/orders?limit=50'
        : `/api/admin/orders?status=${orderStatusFilter}&limit=50`;
      const res = await apiCall(url);
      if (res.success && Array.isArray(res.orders)) {
        setOrders(res.orders);
      }
    } catch (e: any) {
      console.log('Orders fetch error:', e.message);
    } finally {
      setOrdersLoading(false);
    }
  }, [token, orderStatusFilter, apiCall]);

  const fetchProductsData = useCallback(async () => {
    if (!token) return;
    setProductsLoading(true);
    try {
      const res = await apiCall('/api/admin/products');
      if (res.success && Array.isArray(res.products)) {
        setProducts(res.products);
      }
    } catch (e: any) {
      console.log('Products fetch error:', e.message);
    } finally {
      setProductsLoading(false);
    }
  }, [token, apiCall]);

  // Fetch when tab changes or filter updates
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') fetchDashboardData();
    if (activeTab === 'orders') fetchOrdersData();
    if (activeTab === 'products') fetchProductsData();
  }, [activeTab, token, fetchDashboardData, fetchOrdersData, fetchProductsData]);

  // ------------------------------------------
  // ACTIONS: LOGIN, LOGOUT, STATUS, TOGGLE
  // ------------------------------------------
  const handleLogin = async () => {
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Required Fields', 'Please enter both your admin email and password.');
      return;
    }

    setLoginLoading(true);
    try {
      const cleanBase = baseUrl.trim().replace(/\/+$/, '');
      const url = `${cleanBase}/api/admin/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json();
      const userObj = data.admin || data.user;
      const authToken = data.token || (userObj?.id ? simpleBase64(`${userObj.id}:${Date.now()}:admin`) : null);

      if (data.success && userObj && authToken) {
        setToken(authToken);
        setAdminUser(userObj);
        await AsyncStorage.setItem('SHANFA_AUTH_TOKEN', authToken);
        await AsyncStorage.setItem('SHANFA_ADMIN_USER', JSON.stringify(userObj));
        await AsyncStorage.setItem('SHANFA_BASE_URL', cleanBase);
        setLoginPassword('');
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid credentials or access denied.');
      }
    } catch (err: any) {
      Alert.alert('Connection Error', `Unable to reach server. Please check your network and server URL (${baseUrl}).`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    setToken(null);
    setAdminUser(null);
    await AsyncStorage.removeItem('SHANFA_AUTH_TOKEN');
    await AsyncStorage.removeItem('SHANFA_ADMIN_USER');
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await apiCall('/api/admin/orders', {
        method: 'PATCH',
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      if (res.success) {
        Alert.alert('Updated', `Order status changed to ${newStatus}`);
        setSelectedOrderForModal(null);
        fetchOrdersData();
        fetchDashboardData();
      } else {
        Alert.alert('Error', res.error || 'Failed to update order status');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleProductActive = async (productId: string, currentActive: boolean) => {
    setTogglingProductId(productId);
    try {
      const res = await apiCall(`/api/admin/products/${productId}/toggle-active`, {
        method: 'POST',
      });

      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isActive: res.isActive } : p))
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Alert.alert('Error', res.error || 'Failed to toggle product');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setTogglingProductId(null);
    }
  };

  // ------------------------------------------
  // RENDER: LOADING SCREEN
  // ------------------------------------------
  if (isInitializing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  // ------------------------------------------
  // RENDER: LOGIN SCREEN (MINIMAL WHITE THEME)
  // ------------------------------------------
  if (!token) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
          <View style={styles.loginHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>S</Text>
            </View>
            <Text style={styles.loginTitle}>ShanFa Admin Live</Text>
            <Text style={styles.loginSubtitle}>Real-Time Tracking & Order Command Center</Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.inputLabel}>Backend Server URL</Text>
            <TextInput
              style={styles.input}
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="https://shanafaglobal.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Admin Email</Text>
            <TextInput
              style={styles.input}
              value={loginEmail}
              onChangeText={setLoginEmail}
              placeholder="admin@shanafaglobal.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={loginPassword}
              onChangeText={setLoginPassword}
              placeholder="••••••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.primaryButton, loginLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Connect to Live Admin</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ------------------------------------------
  // RENDER: MAIN APPLICATION (WHITE THEME)
  // ------------------------------------------
  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* INSTANT HEADS-UP NOTIFICATION BANNER */}
      {toastBanner && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: toastAnim }],
              borderColor:
                toastBanner.type === 'newOrder'
                  ? '#10B981'
                  : toastBanner.type === 'checkoutEntered'
                  ? '#F59E0B'
                  : '#3B82F6',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.toastInner}
            activeOpacity={0.9}
            onPress={() => {
              if (toastBanner.type === 'newOrder') setActiveTab('orders');
              else setActiveTab('events');
            }}
          >
            <View
              style={[
                styles.toastBadge,
                {
                  backgroundColor:
                    toastBanner.type === 'newOrder'
                      ? '#DCFCE7'
                      : toastBanner.type === 'checkoutEntered'
                      ? '#FEF3C7'
                      : '#DBEAFE',
                },
              ]}
            >
              <Text
                style={[
                  styles.toastBadgeText,
                  {
                    color:
                      toastBanner.type === 'newOrder'
                        ? '#166534'
                        : toastBanner.type === 'checkoutEntered'
                        ? '#92400E'
                        : '#1E40AF',
                  },
                ]}
              >
                {toastBanner.type === 'newOrder'
                  ? 'ORDER'
                  : toastBanner.type === 'checkoutEntered'
                  ? 'CHECKOUT'
                  : 'CART'}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.toastTitle}>{toastBanner.title}</Text>
              <Text style={styles.toastMessage} numberOfLines={2}>
                {toastBanner.message}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.toastCloseBtn}
              onPress={() => {
                if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                Animated.timing(toastAnim, {
                  toValue: -150,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => setToastBanner(null));
              }}
            >
              <Text style={styles.toastCloseText}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.appHeaderTitle}>ShanFa Admin</Text>
          <Text style={styles.appHeaderSubtitle}>{adminUser?.name || 'Administrator'}</Text>
        </View>
        <View style={styles.connectionBadge}>
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: pusherConnected ? '#10B981' : '#EF4444' },
            ]}
          />
          <Text style={styles.connectionText}>
            {pusherConnected ? 'Live Real-Time' : 'Connecting...'}
          </Text>
        </View>
      </View>

      {/* SCREEN CONTENT */}
      <View style={styles.mainContent}>
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <ScrollView
            style={styles.scrollArea}
            refreshControl={
              <RefreshControl refreshing={isDashboardLoading} onRefresh={fetchDashboardData} tintColor="#0F172A" />
            }
          >
            {/* KPI METRICS */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, styles.metricCardPrimary]}>
                <Text style={styles.metricLabel}>Today's Revenue</Text>
                <Text style={styles.metricValue}>
                  AED {dashboardData?.summary?.todayRevenue?.toLocaleString() ?? '0'}
                </Text>
                <Text style={styles.metricFootnote}>
                  {dashboardData?.summary?.todayOrders ?? 0} orders today
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Orders</Text>
                <Text style={styles.metricValue}>
                  {dashboardData?.summary?.totalOrders ?? '0'}
                </Text>
                <Text style={styles.metricFootnote}>Lifetime DB count</Text>
              </View>
            </View>

            {/* ORDER STATUS SUMMARY GRID */}
            <View style={styles.statusGrid}>
              <View style={styles.statusGridItem}>
                <Text style={styles.statusGridCount}>
                  {dashboardData?.summary?.pendingOrders ?? 0}
                </Text>
                <Text style={[styles.statusGridLabel, { color: '#F59E0B' }]}>Pending</Text>
              </View>
              <View style={styles.statusGridItem}>
                <Text style={styles.statusGridCount}>
                  {dashboardData?.summary?.processingOrders ?? 0}
                </Text>
                <Text style={[styles.statusGridLabel, { color: '#3B82F6' }]}>Processing</Text>
              </View>
              <View style={styles.statusGridItem}>
                <Text style={styles.statusGridCount}>
                  {dashboardData?.summary?.shippedOrders ?? 0}
                </Text>
                <Text style={[styles.statusGridLabel, { color: '#8B5CF6' }]}>Shipped</Text>
              </View>
              <View style={styles.statusGridItem}>
                <Text style={styles.statusGridCount}>
                  {dashboardData?.summary?.deliveredOrders ?? 0}
                </Text>
                <Text style={[styles.statusGridLabel, { color: '#10B981' }]}>Delivered</Text>
              </View>
            </View>

            {/* RECENT LIVE ACTIVITY STRIP */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Real-Time Customer Stream</Text>
              <TouchableOpacity onPress={() => setActiveTab('events')}>
                <Text style={styles.sectionAction}>View All ({liveEvents.length})</Text>
              </TouchableOpacity>
            </View>

            {liveEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Waiting for visitor activity...</Text>
                <Text style={styles.emptySubtext}>
                  Cart additions, checkout visits, and new orders will alert here in real-time.
                </Text>
              </View>
            ) : (
              liveEvents.slice(0, 3).map((event) => (
                <View key={event.id} style={styles.liveEventItem}>
                  <View
                    style={[
                      styles.eventIndicator,
                      event.type === 'new-order'
                        ? { backgroundColor: '#10B981' }
                        : event.type === 'checkout-entered'
                        ? { backgroundColor: '#F59E0B' }
                        : { backgroundColor: '#3B82F6' },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventItemTitle}>{event.title}</Text>
                    <Text style={styles.eventItemMessage}>{event.message}</Text>
                  </View>
                  <Text style={styles.eventItemTime}>{event.time}</Text>
                </View>
              ))
            )}

            {/* RECENT DATABASE ORDERS */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Database Orders</Text>
              <TouchableOpacity onPress={() => setActiveTab('orders')}>
                <Text style={styles.sectionAction}>All Orders</Text>
              </TouchableOpacity>
            </View>

            {dashboardData?.recentOrders?.length ? (
              dashboardData.recentOrders.map((ord: any) => (
                <TouchableOpacity
                  key={ord.id}
                  style={styles.orderListItem}
                  onPress={() => setSelectedOrderForModal(ord)}
                >
                  <View style={styles.orderListTop}>
                    <Text style={styles.orderNumber}>#{ord.orderNumber}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            ord.status === 'DELIVERED'
                              ? '#DCFCE7'
                              : ord.status === 'PENDING'
                              ? '#FEF3C7'
                              : ord.status === 'CANCELLED'
                              ? '#FEE2E2'
                              : '#E0E7FF',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              ord.status === 'DELIVERED'
                                ? '#166534'
                                : ord.status === 'PENDING'
                                ? '#92400E'
                                : ord.status === 'CANCELLED'
                                ? '#991B1B'
                                : '#3730A3',
                          },
                        ]}
                      >
                        {ord.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.customerName}>
                    {ord.address?.fullName || ord.address?.name || 'Customer'} • {ord.address?.phone || 'No phone'}
                  </Text>
                  <View style={styles.orderListBottom}>
                    <Text style={styles.orderPrice}>
                      {ord.currency} {ord.totalAmount?.toLocaleString()}
                    </Text>
                    <Text style={styles.orderDate}>
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No recent orders</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <View style={{ flex: 1 }}>
            {/* SEARCH & FILTER */}
            <View style={styles.filterSection}>
              <TextInput
                style={styles.searchBar}
                value={orderSearchQuery}
                onChangeText={setOrderSearchQuery}
                placeholder="Search by customer name, order #, or phone..."
                placeholderTextColor="#94A3B8"
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.filterTab,
                      orderStatusFilter === st && styles.filterTabActive,
                    ]}
                    onPress={() => setOrderStatusFilter(st)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        orderStatusFilter === st && styles.filterTabTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ORDERS LIST */}
            <FlatList
              data={orders.filter((ord) => {
                if (!orderSearchQuery.trim()) return true;
                const q = orderSearchQuery.toLowerCase();
                const name = (ord.address?.fullName || ord.address?.name || '').toLowerCase();
                const phone = (ord.address?.phone || '').toLowerCase();
                const ordNum = String(ord.orderNumber || '');
                return name.includes(q) || phone.includes(q) || ordNum.includes(q);
              })}
              keyExtractor={(item: any) => item.id}
              refreshControl={
                <RefreshControl refreshing={ordersLoading} onRefresh={fetchOrdersData} tintColor="#0F172A" />
              }
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={styles.orderCard}
                  onPress={() => setSelectedOrderForModal(item)}
                >
                  <View style={styles.orderCardHeader}>
                    <View>
                      <Text style={styles.orderCardId}>Order #{item.orderNumber}</Text>
                      <Text style={styles.orderCardCustomer}>
                        {item.address?.fullName || item.address?.name || 'Customer'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.status === 'DELIVERED'
                              ? '#DCFCE7'
                              : item.status === 'PENDING'
                              ? '#FEF3C7'
                              : item.status === 'CANCELLED'
                              ? '#FEE2E2'
                              : '#E0E7FF',
                        },
                      ]}
                      onPress={() => setSelectedOrderForModal(item)}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              item.status === 'DELIVERED'
                                ? '#166534'
                                : item.status === 'PENDING'
                                ? '#92400E'
                                : item.status === 'CANCELLED'
                                ? '#991B1B'
                                : '#3730A3',
                          },
                        ]}
                      >
                        {item.status} ▾
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.orderCardAddress}>
                    📍 {item.address?.addressLine1 || item.address?.street || ''},{' '}
                    {item.address?.city || ''}, {item.address?.country || ''}
                  </Text>
                  <Text style={styles.orderCardPhone}>📞 {item.address?.phone || 'No phone'}</Text>

                  <View style={styles.orderItemsPreview}>
                    <Text style={styles.orderItemsCount}>
                      {item.items?.length || 0} item(s) • Total: {item.currency} {item.totalAmount?.toLocaleString()}
                    </Text>
                    <Text style={styles.paymentMethodBadge}>
                      {item.paymentMethod || 'Card'} ({item.paymentStatus || 'PAID'})
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !ordersLoading ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No orders match your filter</Text>
                  </View>
                ) : null
              }
            />
          </View>
        )}

        {/* TAB 3: PRODUCTS CONTROL */}
        {activeTab === 'products' && (
          <View style={{ flex: 1 }}>
            <View style={styles.filterSection}>
              <TextInput
                style={styles.searchBar}
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                placeholder="Search products in database..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <FlatList
              data={products.filter((p) => {
                if (!productSearchQuery.trim()) return true;
                return (p.name || p.title || '').toLowerCase().includes(productSearchQuery.toLowerCase());
              })}
              keyExtractor={(item: any) => item.id}
              refreshControl={
                <RefreshControl refreshing={productsLoading} onRefresh={fetchProductsData} tintColor="#0F172A" />
              }
              renderItem={({ item }: { item: any }) => (
                <View style={styles.productCard}>
                  {item.images?.[0] ? (
                    <Image source={{ uri: item.images[0] }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Text style={styles.productImagePlaceholderText}>IMG</Text>
                    </View>
                  )}

                  <View style={styles.productDetails}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {item.name || item.title}
                    </Text>
                    <Text style={styles.productPrice}>
                      {item.currency || 'AED'} {item.price || item.countryPrices?.[0]?.price || '0'}
                    </Text>
                    <View style={styles.productTagRow}>
                      <Text style={styles.productTag}>
                        Stock: {item.stockQuantity ?? item.stock ?? 'N/A'}
                      </Text>
                      {item.vatOption === 'EXEMPT' && (
                        <Text style={[styles.productTag, { color: '#10B981' }]}>VAT Exempt</Text>
                      )}
                      {item.deliveryFeeOption === 'FREE' && (
                        <Text style={[styles.productTag, { color: '#3B82F6' }]}>Free Delivery</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.productToggleCol}>
                    <Text style={[styles.toggleStateLabel, { color: item.isActive !== false ? '#10B981' : '#94A3B8' }]}>
                      {item.isActive !== false ? 'Online' : 'Offline'}
                    </Text>
                    {togglingProductId === item.id ? (
                      <ActivityIndicator size="small" color="#0F172A" />
                    ) : (
                      <Switch
                        value={item.isActive !== false}
                        onValueChange={() => handleToggleProductActive(item.id, item.isActive !== false)}
                        trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                        thumbColor="#FFFFFF"
                      />
                    )}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                !productsLoading ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No products found in DB</Text>
                  </View>
                ) : null
              }
            />
          </View>
        )}

        {/* TAB 4: LIVE VISITOR EVENTS */}
        {activeTab === 'events' && (
          <FlatList
            data={liveEvents}
            keyExtractor={(item: any) => item.id}
            style={styles.scrollArea}
            renderItem={({ item }: { item: any }) => (
              <View style={styles.eventCard}>
                <View style={styles.eventCardHeader}>
                  <View
                    style={[
                      styles.eventTag,
                      item.type === 'new-order'
                        ? { backgroundColor: '#DCFCE7' }
                        : item.type === 'checkout-entered'
                        ? { backgroundColor: '#FEF3C7' }
                        : { backgroundColor: '#DBEAFE' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eventTagText,
                        item.type === 'new-order'
                          ? { color: '#166534' }
                          : item.type === 'checkout-entered'
                          ? { color: '#92400E' }
                          : { color: '#1E40AF' },
                      ]}
                    >
                      {item.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.eventTime}>{item.time}</Text>
                </View>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDesc}>{item.message}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No live events yet</Text>
                <Text style={styles.emptySubtext}>
                  Open the web shop, add an item to cart, or open checkout to see immediate live alerts.
                </Text>
              </View>
            }
          />
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <ScrollView style={styles.scrollArea}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionHeader}>Connected Server</Text>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsLabel}>Base URL</Text>
                <TextInput
                  style={styles.input}
                  value={baseUrl}
                  onChangeText={setBaseUrl}
                  onEndEditing={() => AsyncStorage.setItem('SHANFA_BASE_URL', baseUrl)}
                />
                <Text style={styles.settingsCaption}>
                  Point this to your live domain (https://shanafaglobal.com) or custom server IP.
                </Text>
              </View>

              <Text style={styles.settingsSectionHeader}>Alert Preferences</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <View>
                    <Text style={styles.settingsOptionTitle}>Sound Notifications</Text>
                    <Text style={styles.settingsOptionDesc}>Chimes for cart adds, checkouts, and orders</Text>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={setSoundEnabled}
                    trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingsRow, { borderTopWidth: 1, borderColor: '#F1F5F9', marginTop: 12, paddingTop: 12 }]}>
                  <View>
                    <Text style={styles.settingsOptionTitle}>Haptic Vibration</Text>
                    <Text style={styles.settingsOptionDesc}>Physical vibration feedback on alert</Text>
                  </View>
                  <Switch
                    value={vibrationEnabled}
                    onValueChange={setVibrationEnabled}
                    trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <Text style={styles.settingsSectionHeader}>Admin Profile</Text>
              <View style={styles.settingsCard}>
                <Text style={styles.profileName}>{adminUser?.name || 'Admin User'}</Text>
                <Text style={styles.profileEmail}>{adminUser?.email || ''}</Text>
                <Text style={styles.profileRole}>Role: {adminUser?.role || 'ADMIN'}</Text>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* BOTTOM TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabLabel, activeTab === 'products' && styles.tabLabelActive]}>
            Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabLabel, activeTab === 'events' && styles.tabLabelActive]}>
            Live ({liveEvents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* ORDER DETAIL & STATUS UPDATE MODAL */}
      <Modal
        visible={!!selectedOrderForModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedOrderForModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order #{selectedOrderForModal?.orderNumber}</Text>
              <TouchableOpacity onPress={() => setSelectedOrderForModal(null)}>
                <Text style={styles.modalCloseText}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.modalSubheading}>Customer Information</Text>
              <Text style={styles.modalText}>
                👤 {selectedOrderForModal?.address?.fullName || selectedOrderForModal?.address?.name}
              </Text>
              <Text style={styles.modalText}>
                📞 {selectedOrderForModal?.address?.phone || 'No phone'}
              </Text>
              <Text style={styles.modalText}>
                📍 {selectedOrderForModal?.address?.addressLine1 || selectedOrderForModal?.address?.street},{' '}
                {selectedOrderForModal?.address?.city}, {selectedOrderForModal?.address?.country}
              </Text>

              <Text style={[styles.modalSubheading, { marginTop: 16 }]}>Update Fulfillment Status</Text>
              <View style={styles.statusButtonContainer}>
                {ORDER_STATUSES.map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusSelectButton,
                      selectedOrderForModal?.status === st && styles.statusSelectButtonActive,
                    ]}
                    onPress={() => handleUpdateOrderStatus(selectedOrderForModal.id, st)}
                    disabled={isUpdatingStatus}
                  >
                    <Text
                      style={[
                        styles.statusSelectButtonText,
                        selectedOrderForModal?.status === st && styles.statusSelectButtonTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSubheading, { marginTop: 16 }]}>Ordered Items</Text>
              {selectedOrderForModal?.items?.map((item: any, idx: number) => (
                <View key={idx} style={styles.modalItemRow}>
                  <Text style={styles.modalItemName}>
                    {item.product?.name || item.name || item.title || 'Product'}
                  </Text>
                  <Text style={styles.modalItemPrice}>
                    {item.quantity}x @ {selectedOrderForModal.currency} {item.price}
                  </Text>
                </View>
              ))}

              <View style={styles.modalTotalRow}>
                <Text style={styles.modalTotalLabel}>Order Total:</Text>
                <Text style={styles.modalTotalValue}>
                  {selectedOrderForModal?.currency} {selectedOrderForModal?.totalAmount?.toLocaleString()}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// MINIMAL WHITE THEME STYLESHEET
// ==========================================
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loginContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // App Layout
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  appHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  appHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollArea: {
    flex: 1,
    padding: 16,
  },

  // Dashboard Styles
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricCardPrimary: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricFootnote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    justifyContent: 'space-around',
  },
  statusGridItem: {
    alignItems: 'center',
  },
  statusGridCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusGridLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  liveEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  eventIndicator: {
    width: 6,
    height: 36,
    borderRadius: 3,
    marginRight: 12,
  },
  eventItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  eventItemMessage: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  eventItemTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },

  // Order Items
  orderListItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  orderListTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 6,
  },
  orderListBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Orders Tab
  filterSection: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchBar: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  filterTabActive: {
    backgroundColor: '#0F172A',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderCardId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderCardCustomer: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  orderCardAddress: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  orderCardPhone: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  orderItemsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  orderItemsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  paymentMethodBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Products Tab
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  productTagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  productTag: {
    fontSize: 10,
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productToggleCol: {
    alignItems: 'center',
    marginLeft: 8,
  },
  toggleStateLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },

  // Live Events Tab
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  eventTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  eventDesc: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },

  // Settings Tab
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  settingsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  settingsCaption: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  settingsOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 6,
  },
  logoutButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubheading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
  },
  statusButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  statusSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  statusSelectButtonActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusSelectButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusSelectButtonTextActive: {
    color: '#FFFFFF',
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
  },
  modalItemName: {
    fontSize: 13,
    color: '#0F172A',
    flex: 1,
    marginRight: 10,
  },
  modalItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },

  // Heads-Up Alert Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 99999,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  toastBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toastBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  toastMessage: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  toastCloseBtn: {
    padding: 6,
    marginLeft: 6,
  },
  toastCloseText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
});
