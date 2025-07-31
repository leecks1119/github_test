// 보스 시스템
class BossSystem {
    constructor() {
        this.activeBoss = null;
        this.bossTypes = {
            laser: {
                name: "레이저 드레드노트",
                hp: 50,
                maxHp: 50,
                width: 120,
                height: 80,
                speed: 1,
                color: '#ff0066',
                attackPatterns: ['laser', 'sweep', 'charge']
            },
            missile: {
                name: "미사일 크루저",
                hp: 40,
                maxHp: 40,
                width: 100,
                height: 90,
                speed: 1.5,
                color: '#ff6600',
                attackPatterns: ['missile', 'barrage', 'homing']
            },
            shield: {
                name: "실드 타이탄",
                hp: 80,
                maxHp: 80,
                width: 140,
                height: 100,
                speed: 0.8,
                color: '#6600ff',
                attackPatterns: ['shield', 'pulse', 'teleport']
            },
            final: {
                name: "데스 스타",
                hp: 150,
                maxHp: 150,
                width: 200,
                height: 150,
                speed: 0.5,
                color: '#ff3333',
                attackPatterns: ['laser', 'missile', 'pulse', 'teleport', 'ultimate']
            }
        };
    }

    shouldSpawnBoss(level) {
        // 5레벨마다 보스 등장
        return level % 5 === 0 && this.activeBoss === null;
    }

    spawnBoss(level, canvas) {
        const bossTypeNames = Object.keys(this.bossTypes);
        let bossType;
        
        if (level >= 20) {
            bossType = 'final';
        } else if (level >= 15) {
            bossType = 'shield';
        } else if (level >= 10) {
            bossType = 'missile';
        } else {
            bossType = 'laser';
        }

        const template = this.bossTypes[bossType];
        
        this.activeBoss = {
            ...template,
            x: canvas.width / 2 - template.width / 2,
            y: -template.height,
            targetY: 50,
            phase: 'entering',
            attackCooldown: 120,
            phaseTimer: 0,
            currentPattern: 0,
            shieldActive: false,
            teleportCooldown: 0,
            particles: [],
            warningLines: []
        };

        return this.activeBoss;
    }

    updateBoss(canvas, bullets, createParticle, createBullet) {
        if (!this.activeBoss) return { destroyed: false, score: 0 };

        const boss = this.activeBoss;

        // 입장 애니메이션
        if (boss.phase === 'entering') {
            if (boss.y < boss.targetY) {
                boss.y += 2;
            } else {
                boss.phase = 'fighting';
                boss.phaseTimer = 0;
            }
            return { destroyed: false, score: 0 };
        }

        // 전투 페이즈
        if (boss.phase === 'fighting') {
            this.updateBossMovement(boss, canvas);
            this.updateBossAttacks(boss, canvas, bullets, createBullet);
            this.updateBossEffects(boss, createParticle);
        }

        // 죽음 애니메이션
        if (boss.phase === 'dying') {
            boss.phaseTimer++;
            if (boss.phaseTimer % 10 === 0) {
                createParticle(
                    boss.x + Math.random() * boss.width,
                    boss.y + Math.random() * boss.height,
                    15,
                    '#ffff00'
                );
            }

            if (boss.phaseTimer > 60) {
                const score = boss.maxHp * 10;
                this.activeBoss = null;
                return { destroyed: true, score: score };
            }
        }

        boss.phaseTimer++;
        return { destroyed: false, score: 0 };
    }

    updateBossMovement(boss, canvas) {
        // 기본 이동 패턴
        if (boss.teleportCooldown > 0) {
            boss.teleportCooldown--;
        }

        // 좌우 이동
        if (!boss.targetX) {
            boss.targetX = Math.random() * (canvas.width - boss.width);
        }

        const dx = boss.targetX - boss.x;
        if (Math.abs(dx) > 5) {
            boss.x += Math.sign(dx) * boss.speed;
        } else {
            boss.targetX = Math.random() * (canvas.width - boss.width);
        }
    }

    updateBossAttacks(boss, canvas, bullets, createBullet) {
        boss.attackCooldown--;
        
        if (boss.attackCooldown <= 0) {
            const pattern = boss.attackPatterns[boss.currentPattern];
            this.executeAttackPattern(boss, pattern, canvas, bullets, createBullet);
            
            boss.currentPattern = (boss.currentPattern + 1) % boss.attackPatterns.length;
            boss.attackCooldown = 120 + Math.random() * 60;
        }
    }

    executeAttackPattern(boss, pattern, canvas, bullets, createBullet) {
        switch (pattern) {
            case 'laser':
                this.laserAttack(boss, canvas, bullets, createBullet);
                break;
            case 'sweep':
                this.sweepAttack(boss, canvas, bullets, createBullet);
                break;
            case 'charge':
                this.chargeAttack(boss, canvas, bullets, createBullet);
                break;
            case 'missile':
                this.missileAttack(boss, canvas, bullets, createBullet);
                break;
            case 'barrage':
                this.barrageAttack(boss, canvas, bullets, createBullet);
                break;
            case 'homing':
                this.homingAttack(boss, canvas, bullets, createBullet);
                break;
            case 'shield':
                this.shieldAttack(boss);
                break;
            case 'pulse':
                this.pulseAttack(boss, canvas, bullets, createBullet);
                break;
            case 'teleport':
                this.teleportAttack(boss, canvas);
                break;
            case 'ultimate':
                this.ultimateAttack(boss, canvas, bullets, createBullet);
                break;
        }
    }

    laserAttack(boss, canvas, bullets, createBullet) {
        // 경고선 표시 후 레이저 발사
        boss.warningLines.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height,
            width: 8,
            height: canvas.height,
            timer: 60,
            type: 'warning'
        });

        setTimeout(() => {
            for (let i = 0; i < 20; i++) {
                createBullet(boss.x + boss.width / 2 - 4, boss.y + boss.height + i * 10, 0, 8, 'boss-laser');
            }
        }, 1000);
    }

    sweepAttack(boss, canvas, bullets, createBullet) {
        // 좌우로 스위핑하는 레이저
        for (let angle = -45; angle <= 45; angle += 15) {
            const rad = angle * Math.PI / 180;
            createBullet(
                boss.x + boss.width / 2,
                boss.y + boss.height,
                Math.sin(rad) * 4,
                Math.cos(rad) * 4,
                'boss-sweep'
            );
        }
    }

    chargeAttack(boss, canvas, bullets, createBullet) {
        // 돌진 공격
        boss.targetY = canvas.height - 100;
        setTimeout(() => {
            boss.targetY = 50;
        }, 2000);
    }

    missileAttack(boss, canvas, bullets, createBullet) {
        // 유도 미사일
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                createBullet(
                    boss.x + Math.random() * boss.width,
                    boss.y + boss.height,
                    (Math.random() - 0.5) * 4,
                    3,
                    'boss-missile'
                );
            }, i * 200);
        }
    }

    barrageAttack(boss, canvas, bullets, createBullet) {
        // 탄막 공격
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) * Math.PI / 180;
            createBullet(
                boss.x + boss.width / 2,
                boss.y + boss.height,
                Math.sin(angle) * 3,
                Math.cos(angle) * 3,
                'boss-barrage'
            );
        }
    }

    homingAttack(boss, canvas, bullets, createBullet) {
        // 추적 미사일
        createBullet(boss.x + boss.width / 2, boss.y + boss.height, 0, 2, 'boss-homing');
    }

    shieldAttack(boss) {
        // 보호막 활성화
        boss.shieldActive = true;
        setTimeout(() => {
            boss.shieldActive = false;
        }, 5000);
    }

    pulseAttack(boss, canvas, bullets, createBullet) {
        // 충격파 공격
        for (let radius = 50; radius <= 200; radius += 50) {
            setTimeout(() => {
                for (let angle = 0; angle < 360; angle += 30) {
                    const rad = angle * Math.PI / 180;
                    createBullet(
                        boss.x + boss.width / 2,
                        boss.y + boss.height / 2,
                        Math.cos(rad) * 2,
                        Math.sin(rad) * 2,
                        'boss-pulse'
                    );
                }
            }, (radius - 50) * 10);
        }
    }

    teleportAttack(boss, canvas) {
        // 순간이동
        if (boss.teleportCooldown <= 0) {
            boss.x = Math.random() * (canvas.width - boss.width);
            boss.y = Math.random() * 100 + 50;
            boss.teleportCooldown = 300;
        }
    }

    ultimateAttack(boss, canvas, bullets, createBullet) {
        // 최종 보스 궁극기
        this.laserAttack(boss, canvas, bullets, createBullet);
        setTimeout(() => {
            this.pulseAttack(boss, canvas, bullets, createBullet);
        }, 1000);
        setTimeout(() => {
            this.barrageAttack(boss, canvas, bullets, createBullet);
        }, 2000);
    }

    updateBossEffects(boss, createParticle) {
        // 보스 파티클 효과
        if (Math.random() < 0.1) {
            createParticle(
                boss.x + Math.random() * boss.width,
                boss.y + boss.height,
                3,
                boss.color
            );
        }

        // 경고선 업데이트
        boss.warningLines = boss.warningLines.filter(line => {
            line.timer--;
            return line.timer > 0;
        });
    }

    takeDamage(damage) {
        if (!this.activeBoss || this.activeBoss.shieldActive) return false;
        
        this.activeBoss.hp -= damage;
        
        if (this.activeBoss.hp <= 0) {
            this.activeBoss.phase = 'dying';
            this.activeBoss.phaseTimer = 0;
        }
        
        return true;
    }

    drawBoss(ctx, canvas) {
        if (!this.activeBoss) return;

        const boss = this.activeBoss;

        // 경고선 그리기
        boss.warningLines.forEach(line => {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(line.x - line.width/2, line.y, line.width, line.height);
        });

        // 보스 그림자 효과
        if (boss.phase !== 'dying') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(boss.x + 5, boss.y + 5, boss.width, boss.height);
        }

        // 보스 본체
        ctx.fillStyle = boss.color;
        
        // 보스 타입별 모양
        if (boss.name.includes('레이저')) {
            // 레이저 드레드노트 - 삼각형
            ctx.beginPath();
            ctx.moveTo(boss.x + boss.width/2, boss.y);
            ctx.lineTo(boss.x, boss.y + boss.height);
            ctx.lineTo(boss.x + boss.width, boss.y + boss.height);
            ctx.closePath();
            ctx.fill();
            
            // 레이저 포
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(boss.x + boss.width/2 - 5, boss.y + boss.height - 20, 10, 20);
            
        } else if (boss.name.includes('미사일')) {
            // 미사일 크루저 - 육각형
            ctx.beginPath();
            ctx.moveTo(boss.x + boss.width/2, boss.y);
            ctx.lineTo(boss.x + boss.width, boss.y + boss.height/3);
            ctx.lineTo(boss.x + boss.width, boss.y + boss.height*2/3);
            ctx.lineTo(boss.x + boss.width/2, boss.y + boss.height);
            ctx.lineTo(boss.x, boss.y + boss.height*2/3);
            ctx.lineTo(boss.x, boss.y + boss.height/3);
            ctx.closePath();
            ctx.fill();
            
            // 미사일 발사구
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(boss.x + 20 + i * 30, boss.y + boss.height - 15, 8, 15);
            }
            
        } else if (boss.name.includes('실드')) {
            // 실드 타이탄 - 원형
            ctx.beginPath();
            ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, boss.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 실드 효과
            if (boss.shieldActive) {
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, boss.width/2 + 10, 0, Math.PI * 2);
                ctx.stroke();
            }
            
        } else if (boss.name.includes('데스')) {
            // 데스 스타 - 복잡한 구조
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
            
            // 중앙 코어
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // 포탑들
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 4; i++) {
                const angle = i * Math.PI / 2;
                const x = boss.x + boss.width/2 + Math.cos(angle) * 40;
                const y = boss.y + boss.height/2 + Math.sin(angle) * 40;
                ctx.fillRect(x - 5, y - 5, 10, 10);
            }
        }

        // HP 바
        this.drawBossHealthBar(ctx, boss, canvas);

        // 보스 이름
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, canvas.width/2, 30);
    }

    drawBossHealthBar(ctx, boss, canvas) {
        const barWidth = 300;
        const barHeight = 20;
        const x = (canvas.width - barWidth) / 2;
        const y = 50;

        // 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 10);

        // HP 바 배경
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // HP 바
        const hpPercent = boss.hp / boss.maxHp;
        let barColor;
        if (hpPercent > 0.6) barColor = '#00ff00';
        else if (hpPercent > 0.3) barColor = '#ffff00';
        else barColor = '#ff0000';

        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

        // HP 텍스트
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${boss.hp}/${boss.maxHp}`, x + barWidth/2, y + 14);
    }

    getBoss() {
        return this.activeBoss;
    }

    hasBoss() {
        return this.activeBoss !== null;
    }
}

// 전역으로 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BossSystem;
} else {
    window.BossSystem = BossSystem;
}