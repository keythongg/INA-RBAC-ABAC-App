import React, { useState, useEffect } from 'react';
import styles from './index.module.css';
import { Link } from 'react-router-dom';

function Homepage() {
    const [folderPositions, setFolderPositions] = useState({
        NTIP: { x: 100, y: 100 },
        MS: { x: 300, y: 100 },
    });

    useEffect(() => {
        const savedPositions = localStorage.getItem('folderPositions');
        if (savedPositions) {
            setFolderPositions(JSON.parse(savedPositions));
        }
    }, []);


    const [draggingFolder, setDraggingFolder] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [selectedFolders, setSelectedFolders] = useState([]);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });

    const [showFullScreenNote, setShowFullScreenNote] = useState(false);

    useEffect(() => {
        const hasSeenNote = localStorage.getItem('hasSeenFullScreenNote');
        if (!hasSeenNote) {
            setShowFullScreenNote(true);
        }
    }, []);


    // Sačuvaj poziciju foldera
    useEffect(() => {
        localStorage.setItem('folderPositions', JSON.stringify(folderPositions));
    }, [folderPositions]);

    // Full screen na Space tipku
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Sakrij napomenu nakon 5 sekundi
    useEffect(() => {
        if (showFullScreenNote) {
            const timer = setTimeout(() => {
                setShowFullScreenNote(false);
                localStorage.setItem('hasSeenFullScreenNote', 'true');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [showFullScreenNote]);

    const handleMouseDown = (folder, e) => {
        e.preventDefault();
        const currentTime = new Date().getTime();
        const isDoubleClick = currentTime - lastClickTime < 300;

        if (isDoubleClick && folder) {
            window.location.href = `/docs`;
        } else if (!folder) {
            setIsSelecting(true);
            setSelectionBox({ x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY });
            setSelectedFolders([]);
        } else {
            if (!e.ctrlKey && !selectedFolders.includes(folder)) {
                setSelectedFolders([folder]);
            } else if (e.ctrlKey && !selectedFolders.includes(folder)) {
                setSelectedFolders((prev) => [...prev, folder]);
            }
            setDraggingFolder(folder);
            const offsetX = e.clientX - folderPositions[folder].x;
            const offsetY = e.clientY - folderPositions[folder].y;
            setDragOffset({ x: offsetX, y: offsetY });
        }

        setLastClickTime(currentTime);
    };

    const handleMouseMove = (e) => {
        if (isSelecting && !draggingFolder) {
            setSelectionBox((prev) => ({
                ...prev,
                x2: e.clientX,
                y2: e.clientY,
            }));
        } else if (draggingFolder) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const deltaX = newX - folderPositions[draggingFolder].x;
            const deltaY = newY - folderPositions[draggingFolder].y;

            setFolderPositions((prev) => {
                const newPositions = { ...prev };
                if (selectedFolders.length > 1) {
                    selectedFolders.forEach((folder) => {
                        newPositions[folder] = {
                            x: newPositions[folder].x + deltaX,
                            y: newPositions[folder].y + deltaY,
                        };
                    });
                } else {
                    newPositions[draggingFolder] = { x: newX, y: newY };
                }
                return newPositions;
            });
        }
    };

    const handleMouseUp = () => {
        if (isSelecting) {
            const selected = Object.keys(folderPositions).filter((folder) => {
                const { x, y } = folderPositions[folder];
                const { x1, y1, x2, y2 } = selectionBox;
                const minX = Math.min(x1, x2);
                const maxX = Math.max(x1, x2);
                const minY = Math.min(y1, y2);
                const maxY = Math.max(y1, y2);
                return x >= minX && x <= maxX && y >= minY && y <= maxY;
            });
            setSelectedFolders(selected);
        }
        setIsSelecting(false);
        setDraggingFolder(null);
    };

    return (
        <div
            className={styles.fullScreen}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseDown={(e) => handleMouseDown(null, e)}
        >
            {/* Napomena za full screen */}
            {showFullScreenNote && (
                <div className={styles.fullScreenNote}>
                    Pritisnite <strong>Space</strong> za prelazak u full screen mod.
                </div>
            )}

            {/* Folderi */}
            <section
                className={`${styles.animatedCard} ${selectedFolders.includes('NTIP') ? styles.selected : ''}`}
                style={{
                    position: 'absolute',
                    left: folderPositions.NTIP.x,
                    top: folderPositions.NTIP.y,
                }}
                onMouseDown={(e) => handleMouseDown('NTIP', e)}
            >
                <Link
                    to="/docs"
                    className={styles.link}
                    style={{ textDecoration: 'none' }}
                    onClick={(e) => e.preventDefault()}
                >
                    <div className={styles.file}>
                        <div className={styles.work5}></div>
                        <div className={styles.work4}></div>
                        <div className={styles.work3}></div>
                        <div className={styles.work2}></div>
                        <div className={styles.work1}></div>
                    </div>
                    <p className={styles.cardText}>NTIP</p>
                </Link>
            </section>

            <section
                className={`${styles.animatedCard} ${selectedFolders.includes('MS') ? styles.selected : ''}`}
                style={{
                    position: 'absolute',
                    left: folderPositions.MS.x,
                    top: folderPositions.MS.y,
                }}
                onMouseDown={(e) => handleMouseDown('MS', e)}
            >
                <Link
                    to="/docs"
                    className={styles.link}
                    style={{ textDecoration: 'none' }}
                    onClick={(e) => e.preventDefault()}
                >
                    <div className={styles.file}>
                        <div className={styles.work5}></div>
                        <div className={styles.work4}></div>
                        <div className={styles.work3}></div>
                        <div className={styles.work2}></div>
                        <div className={styles.work1}></div>
                    </div>
                    <p className={styles.cardText}>MS</p>
                </Link>
            </section>

            {/* Selekcijski pravougaonik */}
            {isSelecting && (
                <div
                    className={styles.selectionBox}
                    style={{
                        left: Math.min(selectionBox.x1, selectionBox.x2),
                        top: Math.min(selectionBox.y1, selectionBox.y2),
                        width: Math.abs(selectionBox.x2 - selectionBox.x1),
                        height: Math.abs(selectionBox.y2 - selectionBox.y1),
                    }}
                />
            )}

            {/* Taskbar */}
            <div className={styles.taskbar}>
                <div className={styles.mainSection}>
                    <div className={styles.startButton}>Start</div>
                </div>
            </div>
        </div>
    );
}

export default Homepage;