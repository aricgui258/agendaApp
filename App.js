import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Modal, TextInput, SafeAreaView, StatusBar, Platform,
  Dimensions, KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

// ─── CONFIGURACIÓN Y COLORES ───
const COLORS = {
  blue600: '#2563eb',
  blue500: '#3b82f6',
  blue400: '#60a5fa',
  blue300: '#93c5fd',
  blue100: '#dbeafe',
  blue50: '#eff6ff',
  surface: '#ffffff',
  textMain: '#1e293b',
  textSub: '#64748b',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('reminders');
  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Estado del Calendario
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewDate, setViewDate] = useState(new Date());

  const [modalVisible, setModalVisible] = useState(null);
  const [newR, setNewR] = useState({ title: '', desc: '', priority: 'low' });
  const [newT, setNewT] = useState({ title: '', desc: '', status: 'pending', startTime: new Date(), endTime: new Date(new Date().setHours(new Date().getHours() + 1)) });
  const [newE, setNewE] = useState({ title: '', startTime: new Date(), endTime: new Date(new Date().setHours(new Date().getHours() + 1)), color: COLORS.blue500 });
  
  const [showTimePicker, setShowTimePicker] = useState(null); // 'start' | 'end' | null

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const r = await AsyncStorage.getItem('reminders');
      const t = await AsyncStorage.getItem('tasks');
      const e = await AsyncStorage.getItem('events');
      if (r) setReminders(JSON.parse(r));
      if (t) setTasks(JSON.parse(t));
      if (e) setEvents(JSON.parse(e));
    } catch (err) { console.error(err); }
  };

  const saveData = async (key, data) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(data)); }
    catch (err) { console.error(err); }
  };

  // ─── LÓGICA DE RECORDATORIOS ───
  const addReminder = () => {
    if (!newR.title.trim()) return;
    const updated = [{ id: Date.now().toString(), ...newR, done: false }, ...reminders];
    setReminders(updated);
    saveData('reminders', updated);
    setModalVisible(null);
    setNewR({ title: '', desc: '', priority: 'low' });
  };

  const toggleReminder = (id) => {
    const updated = reminders.map(r => r.id === id ? { ...r, done: !r.done } : r);
    setReminders(updated); saveData('reminders', updated);
  };

  const deleteReminder = (id) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated); saveData('reminders', updated);
  };

  // ─── LÓGICA DE TAREAS ───
  const addTask = () => {
    if (!newT.title.trim()) return;
    const start = newT.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = newT.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = [{ id: Date.now().toString(), ...newT, startTime: start, endTime: end }, ...tasks];
    setTasks(updated); saveData('tasks', updated);
    setModalVisible(null);
    setNewT({ title: '', desc: '', status: 'pending', startTime: new Date(), endTime: new Date(new Date().setHours(new Date().getHours() + 1)) });
  };

  const moveTask = (id, newStatus) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTasks(updated); saveData('tasks', updated);
  };

  const deleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated); saveData('tasks', updated);
  };

  // ─── LÓGICA DE AGENDA ───
  const changeMonth = (offset) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(next);
  };

  const addEvent = () => {
    if (!newE.title.trim()) return;
    const start = newE.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = newE.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = [{ id: Date.now().toString(), ...newE, start, end, date: selectedDate }, ...events];
    setEvents(updated); saveData('events', updated);
    setModalVisible(null);
    setNewE({ title: '', startTime: new Date(), endTime: new Date(new Date().setHours(new Date().getHours() + 1)), color: COLORS.blue500 });
  };

  const deleteEvent = (id) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated); saveData('events', updated);
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calDay} />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = today === dateStr;
      const hasEvent = events.some(e => e.date === dateStr);

      days.push(
        <TouchableOpacity 
          key={dateStr} 
          style={[styles.calDay, isSelected && styles.calDayActive, isToday && !isSelected && styles.calDayToday]} 
          onPress={() => setSelectedDate(dateStr)}
        >
          <Text style={[styles.calDayText, isSelected && {color:'#fff'}, isToday && !isSelected && {color:COLORS.blue600}]}>{d}</Text>
          {hasEvent && <View style={[styles.calDot, isSelected && {backgroundColor:'#fff'}]} />}
        </TouchableOpacity>
      );
    }
    return days;
  };

  // ─── VISTAS ───
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerDate}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        <View style={styles.avatar}><Text style={styles.avatarText}>AR</Text></View>
      </View>
      <Text style={styles.headerTitle}>Mi Agenda</Text>
      <View style={styles.tabNav}>
        {['reminders', 'planning', 'agenda'].map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab === 'reminders' ? '🔔' : tab === 'planning' ? '📋' : '📅'}</Text>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab === 'reminders' ? 'Recordatorios' : tab === 'planning' ? 'Planificación' : 'Agenda'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const RemindersView = () => (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.sectionTitle}>Recordatorios ({reminders.filter(r => !r.done).length})</Text>
        {reminders.map(r => (
          <View key={r.id} style={[styles.card, r.done && { opacity: 0.5 }, { borderLeftColor: r.priority === 'high' ? COLORS.danger : r.priority === 'med' ? COLORS.warning : COLORS.success }]}>
            <TouchableOpacity style={[styles.check, r.done && styles.checkActive]} onPress={() => toggleReminder(r.id)}>
              {r.done && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, r.done && { textDecorationLine: 'line-through' }]}>{r.title}</Text>
              {r.desc ? <Text style={styles.cardDesc}>{r.desc}</Text> : null}
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteReminder(r.id)}><Text style={styles.deleteIcon}>🗑</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible('reminder')}>
        <Text style={styles.fabIcon}>+</Text><Text style={styles.fabLabel}>Añadir nuevo recordatorio</Text>
      </TouchableOpacity>
    </View>
  );

  const PlanningView = () => {
    const columns = [
      { id: 'pending', title: 'Pendiente', color: COLORS.warning, icon: '⏳' },
      { id: 'progress', title: 'En progreso', color: COLORS.blue500, icon: '🔄' },
      { id: 'done', title: 'Hecho', color: COLORS.success, icon: '✅' },
    ];
    return (
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planificación</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => setModalVisible('task')}><Text style={{color:'#fff'}}>+</Text></TouchableOpacity>
          </View>
          {columns.map(col => (
            <View key={col.id} style={styles.kanbanCol}>
              <View style={[styles.kanbanHeader, { backgroundColor: col.color }]}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{col.icon} {col.title}</Text>
                <Text style={{ color: '#fff', fontSize: 12 }}>{tasks.filter(t => t.status === col.id).length}</Text>
              </View>
              {tasks.filter(t => t.status === col.id).map(t => (
                <View key={t.id} style={styles.taskCard}>
                  <View style={{flex:1}}>
                    <View style={{flexDirection:'row', alignItems:'center', gap: 5}}>
                      <Text style={styles.taskTitle}>{t.title}</Text>
                      {t.startTime ? <Text style={styles.taskTime}>({t.startTime} - {t.endTime})</Text> : null}
                    </View>
                    {t.desc ? <Text style={styles.taskDesc}>{t.desc}</Text> : null}
                  </View>
                  <View style={styles.taskActions}>
                    {col.id !== 'done' && <TouchableOpacity onPress={() => moveTask(t.id, col.id === 'pending' ? 'progress' : 'done')}><Text>▶</Text></TouchableOpacity>}
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(t.id)}><Text style={styles.deleteIcon}>🗑</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const AgendaView = () => {
    const dayEvents = events.filter(e => e.date === selectedDate);
    return (
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agenda</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => setModalVisible('event')}><Text style={{color:'#fff'}}>+</Text></TouchableOpacity>
          </View>

          <View style={styles.fullCal}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}><Text style={styles.calNavBtn}>‹</Text></TouchableOpacity>
              <Text style={styles.calMonthLabel}>{viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}><Text style={styles.calNavBtn}>›</Text></TouchableOpacity>
            </View>
            <View style={styles.calWeekDays}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <Text key={d} style={styles.calWeekText}>{d}</Text>)}
            </View>
            <View style={styles.calGrid}>{renderCalendarDays()}</View>
          </View>

          <Text style={styles.timelineLabel}>{new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          {dayEvents.map(e => (
            <View key={e.id} style={styles.eventCard}>
              <View style={[styles.eventBar, { backgroundColor: e.color }]} />
              <View style={{flex:1}}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventTime}>{e.start} - {e.end}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteEvent(e.id)}><Text style={styles.deleteIcon}>🗑</Text></TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header />
      {activeTab === 'reminders' && <RemindersView />}
      {activeTab === 'planning' && <PlanningView />}
      {activeTab === 'agenda' && <AgendaView />}

      {/* MODAL RECORDATORIO */}
      <Modal visible={modalVisible === 'reminder'} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nuevo Recordatorio</Text>
          <TextInput style={styles.input} placeholder="¿Qué quieres recordar?" placeholderTextColor={COLORS.textSub} value={newR.title} onChangeText={t => setNewR({...newR, title:t})} />
          <Text style={styles.label}>Prioridad</Text>
          <View style={styles.prioGroup}>
            {['low','med','high'].map(p => (
              <TouchableOpacity key={p} style={[styles.prioBtn, newR.priority === p && {backgroundColor: p==='high'?COLORS.danger:p==='med'?COLORS.warning:COLORS.success}]} onPress={()=>setNewR({...newR, priority:p})}>
                <Text style={{color: newR.priority === p ? '#fff' : COLORS.textSub}}>{p === 'low' ? 'Baja' : p === 'med' ? 'Media' : 'Alta'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.btnSec} onPress={() => setModalVisible(null)}><Text>Cerrar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnPri} onPress={addReminder}><Text style={{color:'#fff', fontWeight:'bold'}}>Guardar</Text></TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL TAREA */}
      <Modal visible={modalVisible === 'task'} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nueva Tarea</Text>
          <TextInput style={styles.input} placeholder="Título de la tarea" placeholderTextColor={COLORS.textSub} value={newT.title} onChangeText={t => setNewT({...newT, title:t})} />
          <TextInput style={[styles.input, {height:80}]} placeholder="Descripción" placeholderTextColor={COLORS.textSub} multiline value={newT.desc} onChangeText={t => setNewT({...newT, desc:t})} />
          
          <Text style={styles.label}>Horario (Inicio - Fin)</Text>
          <View style={{flexDirection:'row', gap:10, marginBottom: 15}}>
            <TouchableOpacity style={[styles.input, {flex:1, marginBottom: 0}]} onPress={() => setShowTimePicker('start')}>
              <Text style={{fontSize: 12, color: COLORS.textSub, marginBottom: 4}}>Inicio</Text>
              <Text>{newT.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.input, {flex:1, marginBottom: 0}]} onPress={() => setShowTimePicker('end')}>
              <Text style={{fontSize: 12, color: COLORS.textSub, marginBottom: 4}}>Fin</Text>
              <Text>{newT.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>
          
          {showTimePicker && (
            <DateTimePicker
              value={showTimePicker === 'start' ? newT.startTime : newT.endTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                const mode = showTimePicker;
                setShowTimePicker(null);
                if (selectedDate) {
                  if (mode === 'start') setNewT({ ...newT, startTime: selectedDate });
                  else setNewT({ ...newT, endTime: selectedDate });
                }
              }}
            />
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.btnSec} onPress={() => setModalVisible(null)}><Text>Cerrar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnPri} onPress={addTask}><Text style={{color:'#fff', fontWeight:'bold'}}>Crear Tarea</Text></TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL EVENTO */}
      <Modal visible={modalVisible === 'event'} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nuevo Evento</Text>
          <TextInput style={styles.input} placeholder="Título del evento" placeholderTextColor={COLORS.textSub} value={newE.title} onChangeText={t => setNewE({...newE, title:t})} />
          <Text style={styles.label}>Horario (Inicio - Fin)</Text>
          <View style={{flexDirection:'row', gap:10, marginBottom: 15}}>
            <TouchableOpacity style={[styles.input, {flex:1, marginBottom: 0}]} onPress={() => setShowTimePicker('start')}>
              <Text style={{fontSize: 10, color: COLORS.textSub, marginBottom: 4}}>Inicio</Text>
              <Text>{newE.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.input, {flex:1, marginBottom: 0}]} onPress={() => setShowTimePicker('end')}>
              <Text style={{fontSize: 10, color: COLORS.textSub, marginBottom: 4}}>Fin</Text>
              <Text>{newE.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={showTimePicker === 'start' ? newE.startTime : newE.endTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                const mode = showTimePicker;
                setShowTimePicker(null);
                if (selectedDate) {
                  if (mode === 'start') setNewE({ ...newE, startTime: selectedDate });
                  else setNewE({ ...newE, endTime: selectedDate });
                }
              }}
            />
          )}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.btnSec} onPress={() => setModalVisible(null)}><Text>Cerrar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnPri} onPress={addEvent}><Text style={{color:'#fff', fontWeight:'bold'}}>Guardar Evento</Text></TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.blue50 },
  header: { backgroundColor: COLORS.blue600, paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerDate: { color: COLORS.blue100, fontSize: 12, textTransform: 'capitalize' },
  avatar: { width: 35, height: 35, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginVertical: 15 },
  tabNav: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 5, marginBottom: 0 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#fff' },
  tabBtnText: { fontSize: 18 },
  tabBtnTextActive: { color: COLORS.blue600 },
  tabLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  tabLabelActive: { color: COLORS.blue600, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain },
  addBtnSmall: { backgroundColor: COLORS.blue600, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 5, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textMain },
  cardDesc: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.blue300, marginRight: 15, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: COLORS.blue500, borderColor: COLORS.blue500 },
  kanbanCol: { marginBottom: 20, borderRadius: 15, overflow: 'hidden', backgroundColor: '#fff', elevation: 2 },
  kanbanHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  taskCard: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.blue50, flexDirection: 'row', alignItems: 'center' },
  taskTitle: { fontSize: 14, fontWeight: '600' },
  taskTime: { fontSize: 12, color: COLORS.blue500, fontWeight: 'bold' },
  taskDesc: { fontSize: 12, color: COLORS.textSub },
  taskActions: { flexDirection: 'row', gap: 10 },
  fullCal: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 20, elevation: 3 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  calMonthLabel: { fontSize: 16, fontWeight: 'bold', textTransform: 'capitalize' },
  calNavBtn: { fontSize: 24, color: COLORS.blue600, paddingHorizontal: 10 },
  calWeekDays: { flexDirection: 'row', marginBottom: 10 },
  calWeekText: { flex: 1, textAlign: 'center', fontSize: 12, color: COLORS.textSub, fontWeight: 'bold' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 5, borderRadius: 10 },
  calDayActive: { backgroundColor: COLORS.blue600 },
  calDayToday: { backgroundColor: COLORS.blue50, borderWidth: 1, borderColor: COLORS.blue200 },
  calDayText: { fontSize: 14, fontWeight: '500' },
  calDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.blue400, marginTop: 2 },
  timelineLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSub, marginBottom: 10, textTransform: 'capitalize' },
  eventCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  eventBar: { width: 4, height: 40, borderRadius: 2, marginRight: 15 },
  eventTitle: { fontWeight: 'bold' },
  eventTime: { fontSize: 12, color: COLORS.textSub },
  fab: { position: 'absolute', bottom: 60, alignSelf: 'center', backgroundColor: COLORS.blue600, flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30, elevation: 8 },
  fabIcon: { color: '#fff', fontSize: 24, marginRight: 10 },
  fabLabel: { color: '#fff', fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 20, opacity: 0.5 },
  emptyText: { fontSize: 14, color: COLORS.textSub },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSub, marginBottom: 10 },
  input: { backgroundColor: COLORS.blue50, padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: COLORS.blue100, color: COLORS.textMain },
  prioGroup: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  prioBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.blue100 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  btnPri: { flex: 1, backgroundColor: COLORS.blue600, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnSec: { flex: 1, backgroundColor: COLORS.blue50, padding: 15, borderRadius: 10, alignItems: 'center' },
  deleteBtn: { padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteIcon: { fontSize: 20, color: COLORS.textSub },
});
