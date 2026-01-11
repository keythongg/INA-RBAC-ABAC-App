import { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Box, MenuItem, Select, FormControl, CircularProgress, useTheme } from "@mui/material";
import Chart from "react-apexcharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import ProductionQuantityLimitsIcon from "@mui/icons-material/ProductionQuantityLimits";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import AssessmentIcon from "@mui/icons-material/Assessment";

// Koristi tvoj api.js umjesto axios
import * as api from "../../services/api"; // ili pravi put do tvog api.js

const Reports = () => {
    const theme = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("monthly");
    const [fuelTypes, setFuelTypes] = useState([]);
    const [refineries, setRefineries] = useState([]);
    const [years, setYears] = useState([]);
    const [fuelType, setFuelType] = useState("");
    const [refinery, setRefinery] = useState("");
    const [year, setYear] = useState("");
    const [chartData, setChartData] = useState({ categories: [], series: [] });
    const [profitabilityData, setProfitabilityData] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [revenueByYear, setRevenueByYear] = useState(0);
    const [fuelStats, setFuelStats] = useState({
        totalProduction: 0,
        totalIncome: 0,
        averagePricePerTon: 0
    });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);

                // Koristi Promise.all za paralelno učitavanje
                const [
                    reportsResponse,
                    fuelTypesResponse,
                    refineriesResponse,
                    yearsResponse,
                    profitabilityResponse,
                    revenueResponse
                ] = await Promise.all([
                    api.fetchReportsData(period),
                    api.fetchFuelTypes(),
                    api.fetchRefineries(),
                    api.fetchYears(),
                    api.fetchFuelProfitability(),
                    api.fetchRevenueByYear("Sve")
                ]);

                // Obrada reports podataka
                if (reportsResponse && Array.isArray(reportsResponse)) {
                    setData(reportsResponse);
                } else {
                    setData([]);
                }

                // Osnovni podaci za filtre
                setFuelTypes(fuelTypesResponse);
                setRefineries(refineriesResponse.map(r => r.refinery));
                setYears(yearsResponse);

                // Profitabilnost podaci
                setProfitabilityData(profitabilityResponse);

                // Izračunaj ukupne statistike
                if (profitabilityResponse && profitabilityResponse.length > 0) {
                    const totalProd = profitabilityResponse.reduce((sum, item) => sum + (item.total_sold || 0), 0);
                    const totalInc = profitabilityResponse.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
                    const avgPrice = totalProd > 0 ? totalInc / totalProd : 0;

                    setFuelStats({
                        totalProduction: totalProd,
                        totalIncome: totalInc,
                        averagePricePerTon: avgPrice
                    });
                }

                // Revenue podaci
                setRevenueByYear(revenueResponse.totalIncome || 0);

            } catch (error) {
                console.error("Greška prilikom učitavanja podataka:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [period]);

    useEffect(() => {
        const fetchProductionData = async () => {
            try {
                // Učitaj podatke za proizvodnju goriva
                const productionResponse = await api.fetchFuelProduction(fuelType, refinery, year);

                if (productionResponse.length === 0) {
                    setChartData({ categories: [], series: [] });
                    return;
                }

                const monthOrder = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];

                const monthNamesHr = {
                    "January": "Siječanj",
                    "February": "Veljača",
                    "March": "Ožujak",
                    "April": "Travanj",
                    "May": "Svibanj",
                    "June": "Lipanj",
                    "July": "Srpanj",
                    "August": "Kolovoz",
                    "September": "Rujan",
                    "October": "Listopad",
                    "November": "Studeni",
                    "December": "Prosinac"
                };

                const fuelTypeMapping = {
                    "Gasoline": "Benzin",
                    "Diesel": "Dizel",
                    "Kerosene": "Kerozin",
                    "Fuel Oil": "Lož ulje",
                    "LPG": "UNP",
                    "Other Products": "Ostali proizvodi"
                };

                const fuelTypesData = {};
                monthOrder.forEach(month => {
                    fuelTypesData[month] = {};
                });

                productionResponse.forEach((entry) => {
                    if (!fuelTypesData[entry.month][entry.fuel_type]) {
                        fuelTypesData[entry.month][entry.fuel_type] = 0;
                    }
                    fuelTypesData[entry.month][entry.fuel_type] += entry.production_tons;
                });

                const uniqueFuelTypes = [...new Set(productionResponse.map(entry => entry.fuel_type))];
                const seriesData = uniqueFuelTypes.map(fType => ({
                    name: fuelTypeMapping[fType] || fType,
                    data: monthOrder.map(month => fuelTypesData[month][fType] || 0)
                }));

                setChartData({
                    categories: monthOrder.map(m => monthNamesHr[m] || m),
                    series: seriesData,
                });

                // Učitaj ukupne prihode za sve godine
                const revenueResponse = await api.fetchRevenueByYear("Sve");
                setRevenueByYear(revenueResponse.totalIncome || 0);

            } catch (error) {
                console.error("Error fetching production data:", error);
            }
        };

        fetchProductionData();
    }, [fuelType, refinery, year]);

    // Sortiranje podataka po mjesecima
    const monthOrder = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const sortedData = [...data].sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

    // Funkcije za formatiranje
    const formatLargeNumber = (num) => {
        if (!num && num !== 0) return "0";

        const number = typeof num === 'string' ? parseFloat(num) : num;

        if (number >= 1000000000) {
            return (number / 1000000000).toFixed(2).replace('.', ',') + ' MLRD';
        } else if (number >= 1000000) {
            return (number / 1000000).toFixed(2).replace('.', ',') + ' MLN';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1).replace('.', ',') + ' K';
        } else {
            return Math.round(number).toLocaleString('hr-HR');
        }
    };

    const formatEuropeanNumber = (number) => {
        if (typeof number !== 'number') return "0,00";
        const fixedNumber = number.toFixed(2);
        const [integerPart, decimalPart] = fixedNumber.split('.');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${formattedInteger},${decimalPart}`;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
        }).format(value);
    };

    // Opcije za glavni chart (analiza proizvodnje)
    const mainChartOptions = {
        chart: {
            type: "bar",
            height: 350,
            stacked: true,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "60%",
                endingShape: "rounded",
                dataLabels: {
                    position: 'top'
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 1,
            colors: ["#fff"]
        },
        xaxis: {
            categories: chartData.categories,
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: 600,
                    colors: theme.palette.text.secondary
                }
            }
        },
        yaxis: {
            title: {
                text: "Proizvodnja (Tona)",
                style: {
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme.palette.text.secondary
                }
            },
            labels: {
                style: { colors: theme.palette.text.secondary },
                formatter: function (val) {
                    return formatLargeNumber(val);
                }
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            theme: theme.palette.mode,
            y: {
                formatter: (val) => `${formatLargeNumber(val)} Tona`
            },
            shared: true,
            intersect: false
        },
        legend: {
            position: "bottom",
            horizontalAlign: "center",
            markers: { width: 12, height: 12, radius: 12 },
            fontSize: '12px',
            fontWeight: 600,
            labels: { colors: theme.palette.text.primary }
        },
        colors: ["#90caf9", "#b39ddb", "#69f0ae", "#ffab91", "#f44336", "#ffe57f"],
        states: { hover: { filter: { type: "none" }, opacity: 0.7 } },
        grid: {
            borderColor: theme.palette.divider
        }
    };

    // Opcije za profitability chart
    const profitabilityChartOptions = {
        chart: {
            type: 'bar',
            height: 250,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: '60%',
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return "$" + formatLargeNumber(val);
            },
            style: {
                fontSize: '11px',
                fontWeight: 'bold'
            }
        },
        xaxis: {
            categories: profitabilityData.map(item => item.fuel_type),
            labels: {
                style: {
                    fontSize: '11px',
                    colors: theme.palette.text.secondary
                }
            }
        },
        yaxis: {
            title: {
                text: "USD",
                style: {
                    fontSize: '12px',
                    color: theme.palette.text.secondary
                }
            },
            labels: {
                style: { colors: theme.palette.text.secondary },
                formatter: function (val) {
                    return "$" + formatLargeNumber(val);
                }
            }
        },
        colors: ['#00E396'],
        grid: {
            borderColor: theme.palette.divider,
        },
        tooltip: {
            theme: theme.palette.mode,
            y: {
                formatter: function (val) {
                    return "$" + formatLargeNumber(val);
                }
            }
        }
    };

    const profitabilitySeries = [{
        name: "Ukupni prihod",
        data: profitabilityData.map(item => item.total_revenue)
    }];

    return (
        <Grid container spacing={3} sx={{ px: 3, mt: 3, width: "100%" }}>
            {/* Kartice sa statistikama */}
            <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
                {[
                    {
                        title: "Ukupna proizvodnja",
                        value: `${formatLargeNumber(fuelStats.totalProduction)} T`,
                        color: "linear-gradient(135deg, #6C5CE7 0%, #8E44AD 100%)",
                        icon: <ProductionQuantityLimitsIcon sx={{ fontSize: 40, color: "#fff" }} />
                    },
                    {
                        title: "Ukupni prihodi",
                        value: `$${formatEuropeanNumber(revenueByYear)}`,
                        color: "linear-gradient(135deg, #0984E3 0%, #00A8FF 100%)",
                        icon: <MonetizationOnIcon sx={{ fontSize: 40, color: "#fff" }} />
                    },
                    {
                        title: "Prosječna cijena po toni",
                        value: `$${formatEuropeanNumber(fuelStats.averagePricePerTon)}/T`,
                        color: "linear-gradient(135deg, #E53935 0%, #D32F2F 100%)",
                        icon: <AnalyticsIcon sx={{ fontSize: 40, color: "#fff" }} />
                    }
                ].map((card, index) => (
                    <Grid key={index} item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
                        <Card sx={{
                            background: card.color,
                            color: "#fff",
                            padding: "24px",
                            borderRadius: "16px",
                            flexGrow: 1,
                            height: "100%",
                            minHeight: "160px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            maxWidth: "100%",
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: '0 12px 20px rgba(0,0,0,0.2)'
                            }
                        }} elevation={0}>
                            <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexGrow: 1 }} elevation={0}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>{card.value}</Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.9 }}>{card.title}</Typography>
                                </Box>
                                <Box sx={{ background: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "50%" }}>
                                    {card.icon}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2} sx={{ mt: 2, alignItems: "stretch" }}>
                {/* Glavni grafikon - Analiza proizvodnje goriva */}
                <Grid item xs={12} md={8}>
                    <Card sx={{
                        padding: "24px",
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: "16px",
                        fontFamily: "Roboto, sans-serif",
                        boxShadow: theme.palette.mode === 'dark' ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)",
                        border: `1px solid ${theme.palette.divider}`,
                        height: "100%",
                        minHeight: "550px"
                    }} elevation={0}>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            <Box display="flex" alignItems="center" mb={3}>
                                <Box sx={{
                                    background: "linear-gradient(135deg, #673ab7 0%, #8e44ad 100%)",
                                    borderRadius: "12px",
                                    p: 1.5,
                                    mr: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <AssessmentIcon sx={{ fontSize: 24, color: "#fff" }} />
                                </Box>
                                <Box flex={1}>
                                    <Typography variant="h6" sx={{
                                        fontWeight: 700,
                                        color: theme.palette.text.primary,
                                        fontSize: "18px",
                                        lineHeight: 1.2
                                    }}>
                                        Analiza proizvodnje goriva
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        color: theme.palette.text.secondary,
                                        fontSize: "13px",
                                        fontWeight: 500
                                    }}>
                                        Pregled mjesečne proizvodnje po vrstama goriva
                                    </Typography>
                                </Box>
                            </Box>

                            <Box display="flex" justifyContent="space-between" mb={3} gap={2} flexWrap="wrap">
                                <FormControl sx={{ minWidth: 180 }}>
                                    <Select
                                        value={fuelType}
                                        onChange={(e) => setFuelType(e.target.value)}
                                        displayEmpty
                                        size="small"
                                    >
                                        <MenuItem value="">Svi tipovi goriva</MenuItem>
                                        {fuelTypes.map((type, index) => (
                                            <MenuItem key={index} value={type}>{type}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ minWidth: 180 }}>
                                    <Select
                                        value={refinery}
                                        onChange={(e) => setRefinery(e.target.value)}
                                        displayEmpty
                                        size="small"
                                    >
                                        <MenuItem value="">Sve rafinerije</MenuItem>
                                        {refineries.map((ref, index) => (
                                            <MenuItem key={index} value={ref}>{ref}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ minWidth: 180 }}>
                                    <Select
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        displayEmpty
                                        size="small"
                                    >
                                        <MenuItem value="">Sve godine</MenuItem>
                                        {years.map((yr, index) => (
                                            <MenuItem key={index} value={yr}>{yr}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box sx={{ height: 400 }}>
                                {loading ? (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <Chart
                                        options={mainChartOptions}
                                        series={chartData.series}
                                        type="bar"
                                        height={400}
                                    />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Kartica: Profitabilnost goriva */}
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        padding: "20px",
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: "16px",
                        fontFamily: "Roboto, sans-serif",
                        height: "100%",
                        boxShadow: theme.palette.mode === 'dark' ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.08)",
                        border: `1px solid ${theme.palette.divider}`,
                        minHeight: "550px"
                    }} elevation={0}>
                        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                            {/* HEADER */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Box sx={{
                                    background: "linear-gradient(135deg, #00E396 0%, #00B386 100%)",
                                    borderRadius: "12px",
                                    p: 1.5,
                                    mr: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <MonetizationOnIcon sx={{ fontSize: 24, color: "#fff" }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{
                                        fontWeight: 700,
                                        color: theme.palette.text.primary,
                                        fontSize: "18px",
                                        lineHeight: 1.2
                                    }}>
                                        Profitabilnost Goriva
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        color: theme.palette.text.secondary,
                                        fontSize: "13px",
                                        fontWeight: 500
                                    }}>
                                        Analiza prihoda po vrstama
                                    </Typography>
                                </Box>
                            </Box>

                            {/* GLAVNI GRAFIKON */}
                            <Box sx={{ mb: 3 }}>
                                <Chart
                                    options={{
                                        ...profitabilityChartOptions,
                                        chart: {
                                            ...profitabilityChartOptions.chart,
                                            height: 180
                                        }
                                    }}
                                    series={profitabilitySeries}
                                    type="bar"
                                    height={180}
                                />
                            </Box>

                            {/* DETALJNA LISTA */}
                            <Box sx={{
                                maxHeight: expanded ? '400px' : '250px',
                                overflow: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '4px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    background: '#f1f1f1',
                                    borderRadius: '10px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    background: '#c1c1c1',
                                    borderRadius: '10px',
                                }
                            }}>
                                {profitabilityData.slice(0, expanded ? profitabilityData.length : 4).map((fuel, index) => (
                                    <Card
                                        key={index}
                                        sx={{
                                            mb: 1.5,
                                            p: 2,
                                            borderRadius: "12px",
                                            border: `1px solid ${theme.palette.divider}`,
                                            backgroundColor: index < 3 ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc') : theme.palette.background.paper,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                borderColor: '#00E396'
                                            }
                                        }}
                                        elevation={0}
                                    >
                                        <Grid container spacing={1} alignItems="center">
                                            <Grid item xs={7}>
                                                <Typography variant="subtitle1" sx={{
                                                    color: theme.palette.text.primary,
                                                    fontSize: "14px",
                                                    fontWeight: "700",
                                                    mb: 0.5
                                                }}>
                                                    {fuel.fuel_type === 'Gasoline' ? 'Benzin' :
                                                        fuel.fuel_type === 'Kerosene' ? 'Kerozin' :
                                                            fuel.fuel_type === 'Fuel Oil' ? 'Lož ulje' :
                                                                fuel.fuel_type === 'Other Products' ? 'Ostalo' : fuel.fuel_type}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: index === 0 ? '#00E396' :
                                                            index === 1 ? '#008FFB' :
                                                                index === 2 ? '#FEB019' : '#FF4560'
                                                    }} />
                                                    <Typography variant="caption" sx={{
                                                        color: theme.palette.text.secondary,
                                                        fontSize: "11px",
                                                        fontWeight: "500"
                                                    }}>
                                                        {formatLargeNumber(fuel.total_sold)} tona
                                                    </Typography>
                                                </Box>
                                            </Grid>

                                            <Grid item xs={5} sx={{ textAlign: "right" }}>
                                                <Typography variant="h6" sx={{
                                                    color: "#00E396",
                                                    fontSize: "15px",
                                                    fontWeight: "800",
                                                    lineHeight: 1.2,
                                                    mb: 0.5
                                                }}>
                                                    ${formatLargeNumber(fuel.total_revenue)}
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    color: "#008FFB",
                                                    fontSize: "10px",
                                                    fontWeight: "600",
                                                    backgroundColor: '#f0f7ff',
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: '6px'
                                                }}>
                                                    ${Math.round(fuel.revenue_per_ton).toLocaleString('hr-HR')}/t
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        {/* PROGRESS BAR */}
                                        {profitabilityData.length > 0 && (
                                            <Box sx={{ mt: 1.5 }}>
                                                <Box sx={{
                                                    width: '100%',
                                                    height: 4,
                                                    backgroundColor: theme.palette.action.selected,
                                                    borderRadius: '2px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <Box sx={{
                                                        width: `${(fuel.total_revenue / profitabilityData[0].total_revenue) * 100}%`,
                                                        height: '100%',
                                                        backgroundColor: index === 0 ? '#00E396' :
                                                            index === 1 ? '#008FFB' :
                                                                index === 2 ? '#FEB019' : '#FF4560',
                                                        borderRadius: '2px',
                                                        transition: 'all 0.3s ease'
                                                    }} />
                                                </Box>
                                            </Box>
                                        )}
                                    </Card>
                                ))}
                            </Box>

                            {/* TOGGLE BUTTON */}
                            {profitabilityData.length > 4 && (
                                <Box mt={2} textAlign="center">
                                    <Box
                                        onClick={() => setExpanded(!expanded)}
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            px: 2,
                                            py: 1,
                                            borderRadius: "8px",
                                            backgroundColor: expanded ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc') : (theme.palette.mode === 'dark' ? 'rgba(0,143,251,0.1)' : '#f0f7ff'),
                                            border: `1px solid ${expanded ? theme.palette.divider : '#008FFB'}`,
                                            cursor: "pointer",
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: expanded ? theme.palette.action.hover : (theme.palette.mode === 'dark' ? 'rgba(0,143,251,0.2)' : '#e6f2ff'),
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: expanded ? theme.palette.text.secondary : "#008FFB",
                                                fontWeight: "700",
                                                fontSize: "12px",
                                                textTransform: "uppercase"
                                            }}
                                        >
                                            {expanded ? "Manje detalja" : "Više detalja"}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* FOOTER */}
                            {profitabilityData.length > 0 && (
                                <Box sx={{
                                    mt: 2,
                                    pt: 2,
                                    borderTop: `1px solid ${theme.palette.divider}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: "500" }}>
                                        Ukupno {profitabilityData.length} vrste goriva
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        color: "#00E396",
                                        fontWeight: "700",
                                        backgroundColor: '#f0faf5',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: '6px'
                                    }}>
                                        ${formatLargeNumber(profitabilityData.reduce((sum, item) => sum + item.total_revenue, 0))}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Reports;