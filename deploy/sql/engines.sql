IF OBJECT_ID('dbo.engines', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.engines (
        engine_id VARCHAR(50) NOT NULL PRIMARY KEY,
        powertrain VARCHAR(20) NOT NULL,
        engine_label NVARCHAR(100) NOT NULL,
        power_output VARCHAR(30) NOT NULL,
        price_eur INT NOT NULL,
        sort_order INT NOT NULL
    );
END;
GO

DELETE FROM dbo.engines;
GO

INSERT INTO dbo.engines (engine_id, powertrain, engine_label, power_output, price_eur, sort_order)
VALUES
    ('k1', 'kinetic',  'Pneumatic Lifter',  '2 kJ',   0,     1),
    ('k2', 'kinetic',  'CO2 Flipper',       '4 kJ',   1500,  2),
    ('k3', 'kinetic',  'Hydraulic Crusher', '8 kJ',   3500,  3),
    ('k4', 'kinetic',  'Spring Launcher',   '12 kJ',  6000,  4),
    ('k5', 'kinetic',  'Pneumatic Hammer',  '18 kJ',  10000, 5),
    ('e1', 'electric', 'Brushed Spinner',   '1.5 kW', 0,     1),
    ('e2', 'electric', 'Vertical Disc',     '3 kW',   1800,  2),
    ('e3', 'electric', 'Horizontal Drum',   '5 kW',   4500,  3),
    ('e4', 'electric', 'Brushless Spinner', '8 kW',   8000,  4),
    ('e5', 'electric', 'Overhead Saw',      '12 kW',  13000, 5);
GO
