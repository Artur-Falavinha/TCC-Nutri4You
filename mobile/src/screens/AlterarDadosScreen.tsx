import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';

export default function AlterarDadosScreen() {
  const [nome, setNome] = useState('Amanda Silva');
  const [email, setEmail] = useState('amanda.silva@email.com');
  const [cpf, setCpf] = useState('123.456.789-00');
  const [telefone, setTelefone] = useState('(11) 98765-4321');
  const [sexo, setSexo] = useState('Masculino');
  const [dataNascimento, setDataNascimento] = useState('01/06/2005');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log('Dados atualizados:', { nome, email, cpf, telefone, sexo, dataNascimento });
      Alert.alert('Sucesso', 'Dados alterados com sucesso!');
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Alterar Dados Pessoais</Text>
        </View>

        <View style={styles.formCard}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOME COMPLETO</Text>
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#64748b" style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-MAIL</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#64748b" style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>CPF</Text>
              <View style={styles.inputContainer}>
                <Feather name="credit-card" size={20} color="#64748b" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={cpf}
                  onChangeText={setCpf}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>TELEFONE</Text>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} color="#64748b" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  keyboardType="phone-pad"
                  value={telefone}
                  onChangeText={setTelefone}
                />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>SEXO</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={sexo}
                  onChangeText={setSexo}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>DATA NASCIMENTO</Text>
              <View style={styles.inputContainer}>
                <Feather name="calendar" size={20} color="#64748b" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  value={dataNascimento}
                  onChangeText={setDataNascimento}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 35,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 30,
    color: '#006f1e',
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#94a3b8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderColor: '#f4f4f5',
    borderWidth: 1,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIconLeft: {
    width: 15,
    height: 15,
    marginRight: 12,
    resizeMode: 'contain',
  },
  input: {
    flex: 1,
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#2d3335',
    height: '100%',
  },
  button: {
    backgroundColor: '#006f1e',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: 'rgba(20, 83, 45, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});

