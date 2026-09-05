// Ponto de entrada do app.
//
// O tratador do alarme em segundo plano precisa ser registrado antes do
// expo-router: quando o Android acorda o app sem tela para entregar uma
// notificação, as telas não são carregadas e um registro feito dentro
// delas nunca aconteceria.
import './src/lib/alarmBackground';
import 'expo-router/entry';
