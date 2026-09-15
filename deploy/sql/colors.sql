IF OBJECT_ID('dbo.colors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.colors (
        color_id VARCHAR(50) NOT NULL PRIMARY KEY,
        color_label NVARCHAR(100) NOT NULL,
        hex_code VARCHAR(7) NOT NULL,
        price_eur INT NOT NULL,
        sort_order INT NOT NULL
    );
END;
GO

DELETE FROM dbo.colors;
GO

INSERT INTO dbo.colors (color_id, color_label, hex_code, price_eur, sort_order)
VALUES
    ('matte_black',   'Matte Black',     '#1a1a1a', 0,    1),
    ('steel_grey',    'Gunmetal Steel',  '#5a6470', 200,  2),
    ('arena_red',     'Arena Red',       '#b22222', 400,  3),
    ('hazard_yellow', 'Hazard Yellow',   '#f1c40f', 400,  4),
    ('war_orange',    'War Orange',      '#e8632c', 600,  5),
    ('jungle_green',  'Camo Green',      '#1a4a2e', 600,  6);
GO
