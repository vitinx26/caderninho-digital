import React, { useState } from 'react';

type EtapaRecuperacao = 'inicio' | 'email' | 'pergunta' | 'novaSenha' | 'sucesso';

export default function RecuperacaoSenha({ onVoltar }: { onVoltar: () => void }) {
  const [etapa, setEtapa] = useState<EtapaRecuperacao>('inicio');
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [respostaSeguranca, setRespostaSeguranca] = useState('');

  const handleSolicitarPorEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Digite seu email');
      return;
    }
    alert('Link de recuperação enviado para ' + email);
    setEtapa('novaSenha');
  };

  const handleRecuperarPorPergunta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !respostaSeguranca) {
      alert('Preencha todos os campos');
      return;
    }
    alert('Identidade verificada');
    setEtapa('novaSenha');
  };

  const handleResetarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenha || !confirmarSenha) {
      alert('Preencha todos os campos');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      alert('Senhas não conferem');
      return;
    }
    if (novaSenha.length < 6) {
      alert('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    alert('Senha alterada com sucesso!');
    setEtapa('sucesso');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #3b82f6, #818cf8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onVoltar}
            style={{
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.5rem'
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Recuperar Senha</h1>
        </div>

        {/* Etapa: Início */}
        {etapa === 'inicio' && (
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Escolha como deseja recuperar sua senha:
            </p>

            <button
              onClick={() => setEtapa('email')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                background: 'white',
                cursor: 'pointer',
                marginBottom: '1rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <span style={{ fontSize: '1.5rem' }}>📧</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: '500' }}>Recuperar por Email</p>
                <p style={{ fontSize: '0.875rem', color: '#999' }}>Receba um link no seu email</p>
              </div>
            </button>

            <button
              onClick={() => setEtapa('pergunta')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                background: 'white',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <span style={{ fontSize: '1.5rem' }}>❓</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: '500' }}>Pergunta de Segurança</p>
                <p style={{ fontSize: '0.875rem', color: '#999' }}>Responda uma pergunta sobre você</p>
              </div>
            </button>
          </div>
        )}

        {/* Etapa: Email */}
        {etapa === 'email' && (
          <form onSubmit={handleSolicitarPorEmail} style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1.5rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}
            >
              Enviar Link de Recuperação
            </button>

            <button
              type="button"
              onClick={() => setEtapa('inicio')}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'white',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Voltar
            </button>
          </form>
        )}

        {/* Etapa: Pergunta de Segurança */}
        {etapa === 'pergunta' && (
          <form onSubmit={handleRecuperarPorPergunta} style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1.5rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Qual é o seu nome?
              </label>
              <input
                type="text"
                value={respostaSeguranca}
                onChange={(e) => setRespostaSeguranca(e.target.value)}
                placeholder="Seu nome completo"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                Digite exatamente como está cadastrado
              </p>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}
            >
              Verificar Identidade
            </button>

            <button
              type="button"
              onClick={() => setEtapa('inicio')}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'white',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Voltar
            </button>
          </form>
        )}

        {/* Etapa: Nova Senha */}
        {etapa === 'novaSenha' && (
          <form onSubmit={handleResetarSenha} style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1.5rem'
          }}>
            <div style={{
              background: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#166534' }}>
                ✓ Identidade verificada. Defina uma nova senha.
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Nova Senha
              </label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme sua senha"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.375rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Alterar Senha
            </button>
          </form>
        )}

        {/* Etapa: Sucesso */}
        {etapa === 'sucesso' && (
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              background: '#dcfce7',
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              🔒
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Senha Alterada com Sucesso!
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Você pode fazer login com sua nova senha agora.
            </p>

            <button
              onClick={onVoltar}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Voltar ao Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
