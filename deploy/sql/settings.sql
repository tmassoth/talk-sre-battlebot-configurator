IF OBJECT_ID('dbo.settings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.settings (
        setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
        setting_value NVARCHAR(500) NOT NULL
    );
END;
GO

MERGE dbo.settings AS target
USING (VALUES
    ('maintenance_mode', 'false')
) AS source (setting_key, setting_value)
ON target.setting_key = source.setting_key
WHEN NOT MATCHED THEN
    INSERT (setting_key, setting_value)
    VALUES (source.setting_key, source.setting_value);
GO
