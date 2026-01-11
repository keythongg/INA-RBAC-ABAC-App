import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, TextField, IconButton, Typography, Avatar,
    Fab, Fade, Grow, Chip, useTheme, Divider, Button, Tooltip, CircularProgress
} from '@mui/material';
import {
    Send as SendIcon,
    SmartToy as BotIcon,
    Close as CloseIcon,
    Settings as SettingsIcon,
    Psychology as BrainIcon,
    Inventory as InventoryIcon,
    Security as SecurityIcon,
    Assignment as TaskIcon,
    Save as SaveIcon,
    Key as KeyIcon
} from '@mui/icons-material';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';

const AiChatAssistant = () => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [provider, setProvider] = useState(localStorage.getItem('ai_provider') || 'google');
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [modelName, setModelName] = useState(localStorage.getItem('gemini_model') || 'gemini-1.5-flash');
    const [messages, setMessages] = useState([
        { id: 1, text: "Pozdrav! Ja sam INA Intel. Odaberite AI providera (OpenAI ili Google) u postavkama i unesite ključ! 🧠", sender: 'bot' }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, open, showSettings]);

    // Automatska promjena modela kad se promijeni provider
    useEffect(() => {
        if (provider === 'openai' && (modelName.includes('gemini') || modelName.includes('sonar'))) {
            setModelName('gpt-4o-mini');
        } else if (provider === 'google' && (!modelName.includes('gemini'))) {
            setModelName('gemini-1.5-flash');
        } else if (provider === 'perplexity' && (!modelName.includes('sonar'))) {
            setModelName('sonar');
        }
    }, [provider]);

    const saveSettings = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        localStorage.setItem('gemini_model', modelName);
        localStorage.setItem('ai_provider', provider);
        setShowSettings(false);
        setMessages(prev => [...prev, { id: Date.now(), text: `Postavke spremljene! Provider: ${provider}, Model: ${modelName}`, sender: 'bot' }]);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        const question = input;
        setInput("");
        setIsTyping(true);

        if (!apiKey) {
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now(), text: "Molim unesite API ključ u postavkama (gumb kotačića).", sender: 'bot' }]);
                setIsTyping(false);
            }, 500);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // Call Backend Proxy - CONTEXT IS NOW GENERATED ON SERVER (RBAC SECURE)
            const res = await axios.post('http://localhost:5000/api/chat', {
                message: question,
                apiKey: apiKey,
                model: modelName,
                provider: provider
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [...prev, { id: Date.now(), text: res.data.text, sender: 'bot' }]);
        } catch (error) {
            console.error("AI Error", error);
            // Prikaz detaljne poruke s backenda
            let errorMsg = error.response?.data?.error || `Greška: ${error.message}`;
            setMessages(prev => [...prev, { id: Date.now(), text: `⚠️ ${errorMsg}`, sender: 'bot' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickAction = (action) => {
        setInput(action);
    };

    return (
        <>
            {/* TOGGLE BUTTON */}
            <Grow in={!open}>
                <Fab
                    color="primary"
                    aria-label="chat"
                    onClick={() => setOpen(true)}
                    sx={{
                        position: 'fixed',
                        bottom: 30,
                        right: 30,
                        zIndex: 1200,
                        background: 'linear-gradient(45deg, #6200EA 30%, #B388FF 90%)', // Deep Purple AI vibe
                        boxShadow: '0 3px 15px 4px rgba(98, 0, 234, .3)',
                        '&:hover': { transform: 'scale(1.1)', transition: 'all 0.3s' }
                    }}
                >
                    <BotIcon />
                </Fab>
            </Grow>

            {/* CHAT WINDOW */}
            <Grow in={open} style={{ transformOrigin: 'bottom right' }}>
                <Paper
                    elevation={24}
                    sx={{
                        position: 'fixed',
                        bottom: 30,
                        right: 30,
                        width: 400,
                        height: 600,
                        zIndex: 1201,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        backdropFilter: 'blur(20px)',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)'
                    }}
                >
                    {/* HEADER */}
                    <Box sx={{
                        p: 2,
                        background: 'linear-gradient(45deg, #4527A0 30%, #7E57C2 90%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ bgcolor: 'white', color: '#4527A0' }}>
                                <BrainIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">INA Intel 2.0</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 8, height: 8, bgcolor: '#00E676', borderRadius: '50%' }} />
                                    Powered by Gemini
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <IconButton size="small" onClick={() => setShowSettings(!showSettings)} sx={{ color: 'white', mr: 0.5 }}>
                                <SettingsIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* SETTINGS LAYER */}
                    {showSettings && (
                        <Fade in={showSettings}>
                            <Box sx={{
                                position: 'absolute',
                                top: 70, left: 0, right: 0,
                                p: 3,
                                bgcolor: 'background.paper',
                                zIndex: 10,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}>
                                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                    <KeyIcon color="primary" /> Konfiguracija AI
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    Odaberite providera i unesite odgovarajući API ključ.
                                </Typography>

                                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                                    <Button
                                        variant={provider === 'google' ? "contained" : "outlined"}
                                        onClick={() => setProvider('google')}
                                        sx={{ flex: 1 }}
                                        color="primary"
                                    >
                                        Google
                                    </Button>
                                    <Button
                                        variant={provider === 'openai' ? "contained" : "outlined"}
                                        onClick={() => setProvider('openai')}
                                        sx={{ flex: 1 }}
                                        color="secondary"
                                    >
                                        OpenAI
                                    </Button>
                                    <Button
                                        variant={provider === 'perplexity' ? "contained" : "outlined"}
                                        onClick={() => setProvider('perplexity')}
                                        sx={{ flex: 1, borderColor: '#00838f', color: provider === 'perplexity' ? 'white' : '#00838f', bgcolor: provider === 'perplexity' ? '#00838f' : 'transparent', '&:hover': { bgcolor: '#006064' } }}
                                    >
                                        Perplexity
                                    </Button>
                                </Box>

                                <TextField
                                    fullWidth
                                    size="small"
                                    type="password"
                                    label={
                                        provider === 'google' ? "Google Gemini API Key" :
                                            provider === 'openai' ? "OpenAI API Key (sk-...)" :
                                                "Perplexity API Key (pplx-...)"
                                    }
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Model Name"
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                    helperText={
                                        provider === 'google' ? "Npr. gemini-1.5-flash" :
                                            provider === 'openai' ? "Npr. gpt-4o-mini, gpt-3.5-turbo" :
                                                "Npr. sonar, sonar-pro"
                                    }
                                    sx={{ mb: 2 }}
                                />
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={saveSettings}
                                    startIcon={<SaveIcon />}
                                    sx={{ bgcolor: '#00C853', '&:hover': { bgcolor: '#00E676' } }}
                                >
                                    Spremi i Zatvori
                                </Button>
                            </Box>
                        </Fade>
                    )}

                    {/* MESSAGES AREA */}
                    <Box sx={{
                        flex: 1,
                        p: 2,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8f9fa'
                    }}>
                        {messages.map((msg) => (
                            <Box
                                key={msg.id}
                                sx={{
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                }}
                            >
                                <Paper sx={{
                                    p: 2,
                                    borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    bgcolor: msg.sender === 'user' ? 'primary.main' : 'background.paper',
                                    color: msg.sender === 'user' ? 'white' : 'text.primary',
                                    boxShadow: 2,
                                    position: 'relative',
                                    '& a': { color: 'inherit', textDecoration: 'underline' }
                                }}>
                                    {msg.sender === 'bot' ? (
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    ) : (
                                        <Typography variant="body1">{msg.text}</Typography>
                                    )}
                                </Paper>
                            </Box>
                        ))}
                        {isTyping && (
                            <Box sx={{ alignSelf: 'flex-start', ml: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Analiziram podatke...
                                </Typography>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* SUGGESTIONS */}
                    <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, overflowX: 'auto', borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Chip icon={<InventoryIcon />} label="Analiziraj zalihe" onClick={() => handleQuickAction("Napravi detaljnu analizu trenutnih zaliha goriva.")} clickable color="info" variant="outlined" size="small" />
                        <Chip icon={<TaskIcon />} label="Moji prioriteti" onClick={() => handleQuickAction("Što mi je najvažnije napraviti danas s obzirom na zadatke?")} clickable color="warning" variant="outlined" size="small" />
                        <Chip icon={<SecurityIcon />} label="Sigurnost" onClick={() => handleQuickAction("Postoje li sigurnosne prijetnje na koje trebam obratiti pozornost?")} clickable color="error" variant="outlined" size="small" />
                    </Box>

                    {/* INPUT AREA */}
                    <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Box display="flex" gap={1}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={apiKey ? "Pitajte INA Intel..." : "Prvo unesite API ključ u postavkama"}
                                value={input}
                                disabled={!apiKey}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 4,
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                    }
                                }}
                            />
                            <IconButton
                                color="primary"
                                onClick={handleSend}
                                disabled={!input.trim() || !apiKey}
                                sx={{
                                    bgcolor: (input.trim() && apiKey) ? 'primary.main' : 'action.disabledBackground',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'primary.dark' },
                                    width: 40,
                                    height: 40,
                                    borderRadius: '12px'
                                }}
                            >
                                <SendIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                </Paper>
            </Grow>
        </>
    );
};

export default AiChatAssistant;
