import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from './db.js';

const app = express();
const port = 3000;

// Ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Manejo de formularios

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta al home
app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

// ¿Cuántos jugadores se unieron en el último mes?
app.get('/consulta/jugadores-recientes', async (req, res) => {
  try {
    const result = await sql`
      SELECT COUNT(*) AS jugadores_recientes
      FROM Usuario
      WHERE rol = 'jugador' AND fecha_reg >= CURRENT_DATE - INTERVAL '1 month';
    `;
    res.send(`Cantidad de jugadores recientes: ${result[0].jugadores_recientes}`);
  } catch (error) {
    console.error('Error en /consulta/jugadores-recientes:', error);
    res.status(500).send('Error al obtener los datos');
  }
});

// ¿Cuál es el jugador con la mejor relación K/D en un torneo específico?
app.get('/consulta/kd-torneo', async (req, res) => {
  try {
    const torneoId = req.query.torneoId;
    console.log('Recibiendo torneoId:', torneoId); // Debugging
    if (!torneoId) {
      return res.status(400).send('El parámetro "torneoId" es requerido.');
    }

    const result = await sql`
      SELECT j.nombre AS jugador, t.nombre AS torneo, 
      SUM(e.kills)::FLOAT / NULLIF(SUM(e.deaths), 0) AS kd_ratio
      FROM Estadistica e
      JOIN Jugador j ON e.id_jugador = j.id_jugador
      JOIN Partida p ON e.id_partida = p.id_partida
      JOIN Torneo t ON p.id_torneo = t.id_torneo
      WHERE t.id_torneo = ${torneoId}
      GROUP BY j.nombre, t.nombre
      ORDER BY kd_ratio DESC
      LIMIT 1;
    `;
    console.log('Resultado de la consulta K/D:', result); // Debugging
    if (result.length === 0) {
      return res.send('No se encontraron jugadores para el torneo especificado.');
    }

    const jugador = result[0];
    res.send(
      `El jugador con la mejor relación K/D en el torneo ${jugador.torneo} es ${jugador.jugador}, con una relación K/D de ${jugador.kd_ratio.toFixed(2)}`
    );
  } catch (error) {
    console.error('Error en /consulta/kd-torneo:', error);
    res.status(500).send('Error al obtener los datos');
  }
});

// ¿Cuántos jugadores hay en un equipo especifico?
app.get('/consulta/jugadores-equipo', async (req, res) => {
  try {
    const equipoId = req.query.equipoId;
    console.log('Recibiendo equipoId:', equipoId); // Debugging
    if (!equipoId) {
      return res.status(400).send('El parametro "equipoId" es requerido.');
    }

    const result = await sql`
      SELECT COUNT(*) AS cantidad_jugadores
      FROM Jugador
      WHERE id_equipo = ${equipoId};
    `;
    console.log('Resultado de la consulta jugadores-equipo:', result); // Debugging
    if (result.length === 0) {
      return res.send('No se encontraron jugadores para el equipo especificado.');
    }

    res.send(`El equipo con ID ${equipoId} tiene ${result[0].cantidad_jugadores} jugadores.`);
  } catch (error) {
    console.error('Error en /consulta/jugadores-equipo:', error);
    res.status(500).send('Error al obtener los datos');
  }
});

// ¿Cuál es el equipo con más logros?
app.get('/consulta/equipo-mas-logros', async (req, res) => {
  try {
    console.log('Consulta: Equipo con más logros'); // Debugging

    const result = await sql`
      SELECT nombre, logros
      FROM Equipo
      ORDER BY logros DESC
      LIMIT 1;
    `;

    console.log('Resultado de la consulta equipo-mas-logros:', result); // Debugging

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos.' });
    }

    const equipo = result[0];
    res.json(equipo); // Enviar respuesta como JSON
  } catch (error) {
    console.error('Error en /consulta/equipo-mas-logros:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Cuál es el porcentaje de victorias de los equipos en los últimos 10 torneos?
app.get('/consulta/porcentaje-victorias', async (req, res) => {
  try {
    console.log('Consulta: Porcentaje de victorias en los últimos 10 torneos'); // Debugging

    const result = await sql`
      SELECT eq.nombre AS equipo, 
             COUNT(t.id_torneo)::FLOAT / 10 * 100 AS porcentaje_victorias
      FROM Torneo t
      JOIN Equipo eq ON t.id_equipo_ganador = eq.id_equipo
      WHERE t.fecha_fin IS NOT NULL
      GROUP BY eq.nombre
      ORDER BY porcentaje_victorias DESC
      LIMIT 10;
    `;

    console.log('Resultado de la consulta porcentaje-victorias:', result); // Debugging

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos con victorias.' });
    }

    res.json(result); // Enviar respuesta como JSON
  } catch (error) {
    console.error('Error en /consulta/porcentaje-victorias:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});


// ¿Cuál es el porcentaje de victorias de los equipos en los últimos 10 torneos?
app.get('/consulta/porcentaje-victorias', async (req, res) => {
  try {
    console.log('Consulta: Porcentaje de victorias en los últimos 10 torneos'); // Debugging

    const result = await sql`
      SELECT eq.nombre AS equipo, 
             COUNT(t.id_torneo)::FLOAT / 10 * 100 AS porcentaje_victorias
      FROM Torneo t
      JOIN Equipo eq ON t.id_equipo_ganador = eq.id_equipo
      WHERE t.fecha_fin IS NOT NULL
      GROUP BY eq.nombre
      ORDER BY porcentaje_victorias DESC
      LIMIT 10;
    `;

    console.log('Resultado de la consulta porcentaje-victorias:', result); // Debugging

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos con victorias.' });
    }

    res.json(result); // Enviar respuesta como JSON
  } catch (error) {
    console.error('Error en /consulta/porcentaje-victorias:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Cuántos torneos ha ganado cada equipo?
app.get('/consulta/torneos-ganados', async (req, res) => {
  try {
    const result = await sql`
      SELECT eq.nombre AS equipo, 
             COALESCE(COUNT(t.id_torneo), 0) AS torneos_ganados
      FROM Equipo eq
      LEFT JOIN Torneo t ON t.id_equipo_ganador = eq.id_equipo
      GROUP BY eq.nombre
      ORDER BY torneos_ganados DESC;
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos con torneos ganados.' });
    }

    res.json(result); // Enviar respuesta como JSON
  } catch (error) {
    console.error('Error en /consulta/torneos-ganados:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});


// ¿Qué equipo tiene el mayor número de miembros?
app.get('/consulta/equipo-mas-miembros', async (req, res) => {
  try {
    console.log('Consulta: Equipo con más miembros'); // Debugging

    const result = await sql`
      SELECT eq.nombre AS equipo, COUNT(j.id_jugador) AS numero_miembros
      FROM Equipo eq
      JOIN Jugador j ON eq.id_equipo = j.id_equipo
      GROUP BY eq.nombre
      ORDER BY numero_miembros DESC
      LIMIT 1;
    `;

    console.log('Resultado de la consulta equipo-mas-miembros:', result); // Debugging

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos.' });
    }

    const equipo = result[0];
    res.json(equipo); // Enviar respuesta como JSON
  } catch (error) {
    console.error('Error en /consulta/equipo-mas-miembros:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Cuántos torneos ha ganado cada equipo?
app.get('/consulta/torneos-ganados', async (req, res) => {
  try {
    const result = await sql`
      SELECT eq.nombre AS equipo, COUNT(t.id_torneo) AS torneos_ganados
      FROM Torneo t
      JOIN Equipo eq ON t.id_equipo_ganador = eq.id_equipo
      GROUP BY eq.nombre
      ORDER BY torneos_ganados DESC;
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error en /consulta/torneos-ganados:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Porcentaje de victorias en cada mapa por un equipo en un torneo?
app.get('/consulta/porcentaje-victorias-mapas', async (req, res) => {
  try {
    const equipoId = req.query.equipoId;
    const torneoId = req.query.torneoId;

    if (!equipoId || !torneoId) {
      return res.status(400).send('Parámetros "equipoId" y "torneoId" son requeridos.');
    }

    const result = await sql`
      SELECT m.nombre AS mapa, 
             COUNT(p.id_partida)::FLOAT / 
             (SELECT COUNT(*) FROM Partida WHERE id_torneo = ${torneoId}) * 100 AS porcentaje_victorias
      FROM Partida p
      JOIN Mapa m ON p.id_mapa = m.id_mapa
      WHERE p.id_torneo = ${torneoId} AND p.id_equipo_ganador = ${equipoId}
      GROUP BY m.nombre
      ORDER BY porcentaje_victorias DESC;
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error en /consulta/porcentaje-victorias-mapas:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Qué mapa fue más usado en un torneo específico?
app.get('/consulta/mapa-mas-usado', async (req, res) => {
  try {
    const torneoId = req.query.torneoId;

    if (!torneoId) {
      return res.status(400).send('El parámetro "torneoId" es requerido.');
    }

    const result = await sql`
      SELECT m.nombre AS mapa, COUNT(p.id_partida) AS veces_usado
      FROM Partida p
      JOIN Mapa m ON p.id_mapa = m.id_mapa
      WHERE p.id_torneo = ${torneoId}
      GROUP BY m.nombre
      ORDER BY veces_usado DESC
      LIMIT 1;
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error en /consulta/mapa-mas-usado:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});



app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

//dhjsdjfhjdsfdsf