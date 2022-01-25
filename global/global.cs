using System;
using System.Text;
using System.Net;
using System.Net.Sockets;
using System.IO;
using System.Diagnostics;
using System.Data.SQLite;
using System.Collections.Generic;

namespace global
{
    class Program
    {
        private static string databaseName = System.IO.Path.GetDirectoryName(Process.GetCurrentProcess().MainModule.FileName).ToString()
    + "\\LogsDataBase.SQLite";
        private static List<string> GlovalKeyCodes = new List<string>();
        private static void ExecuteMachines()
        {
            var Machines = File.ReadAllLines(System.IO.Path.GetDirectoryName(Process.GetCurrentProcess().MainModule.FileName).ToString() + "\\Machines.txt");
            foreach (var Machine in Machines)
            {
                string[] ForDivision = Machine.Split(new char[] {' '});
                string DivisionName = ForDivision[0];
                string DivisionKeyCode = ForDivision[1];
                SQLiteConnection connection = new SQLiteConnection(string.Format("Data Source={0};", databaseName));
                SQLiteCommand Stub = new SQLiteCommand("INSERT INTO MachineInfo (MachineName, MachineKeyCode) " +
                    "VALUES (@StubMachine,@StubKeyCode);", connection);
                Stub.Parameters.AddWithValue("@StubMachine", DivisionName);
                Stub.Parameters.AddWithValue("@StubKeyCode", DivisionKeyCode);
                connection.Open();
                Stub.ExecuteNonQuery();
                connection.Close();
                GlovalKeyCodes.Add(DivisionKeyCode);
            }
        }
        private static void FirstRunDB()
        {
            if (!File.Exists(databaseName))
            {
                SQLiteConnection.CreateFile(databaseName);
                SQLiteConnection connection = new SQLiteConnection(string.Format("Data Source={0};", databaseName));
                SQLiteCommand command = new SQLiteCommand("PRAGMA foreign_keys=on; CREATE TABLE LogApplication(LogId INTEGER PRIMARY KEY AUTOINCREMENT, MachineName TEXT, " +
                    "FolderName TEXT, EntryType TEXT, TimeGenerated NUMERIC, Source TEXT, MessageText TEXT, " +
                    "FOREIGN KEY (MachineName) REFERENCES MachineInfo(MachineName)); CREATE TABLE LogSecurity(LogId INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "MachineName TEXT, FolderName TEXT, EntryType TEXT, TimeGenerated NUMERIC, Source TEXT, MessageText TEXT, " +
                    "FOREIGN KEY (MachineName) REFERENCES MachineInfo(MachineName)); CREATE TABLE LogSystem(LogId INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "MachineName TEXT, FolderName TEXT, EntryType TEXT, TimeGenerated NUMERIC, Source TEXT, MessageText TEXT, " +
                    "FOREIGN KEY (MachineName) REFERENCES MachineInfo(MachineName)); CREATE TABLE MachineInfo (MachineName TEXT PRIMARY KEY, " +
                    "MachineKeyCode);", connection);
                connection.Open();
                command.ExecuteNonQuery();
                connection.Close();
                ExecuteMachines();
            }
        }
        private static void WriteIntoDataBaseApplication(string DataOfMachine, string DataOfFolder, string DataOfEntryType,
            string DataOfTimeGenerated, string DataOfSource, string DataOfMessage)
        {
            SQLiteConnection connection = new SQLiteConnection(string.Format("Data Source={0};", databaseName));
            SQLiteCommand command = new SQLiteCommand("INSERT INTO LogApplication (MachineName, FolderName, EntryType, TimeGenerated, " +
                "Source, MessageText) VALUES (@DataOfMachine, @DataOfFolder, @DataOfEntryType, @DataOfTimeGenerated, " +
                "@DataOfSource, @DataOfMessage);", connection);
            command.Parameters.AddWithValue("@DataOfMachine", DataOfMachine);
            command.Parameters.AddWithValue("@DataOfFolder", DataOfFolder);
            command.Parameters.AddWithValue("@DataOfEntryType", DataOfEntryType);
            command.Parameters.AddWithValue("@DataOfTimeGenerated", DataOfTimeGenerated);
            command.Parameters.AddWithValue("@DataOfSource", DataOfSource);
            command.Parameters.AddWithValue("@DataOfMessage", DataOfMessage);
            connection.Open();
            command.ExecuteNonQuery();
            connection.Close();
        }
        private static void WriteIntoDataBaseSecurity(string DataOfMachine, string DataOfFolder, string DataOfEntryType,
            string DataOfTimeGenerated, string DataOfSource, string DataOfMessage)
        {
            SQLiteConnection connection = new SQLiteConnection(string.Format("Data Source={0};", databaseName));
            SQLiteCommand command = new SQLiteCommand("INSERT INTO LogSecurity (MachineName, FolderName, EntryType, TimeGenerated, " +
                "Source, MessageText) VALUES (@DataOfMachine, @DataOfFolder, @DataOfEntryType, @DataOfTimeGenerated, " +
                "@DataOfSource, @DataOfMessage);", connection);
            command.Parameters.AddWithValue("@DataOfMachine", DataOfMachine);
            command.Parameters.AddWithValue("@DataOfFolder", DataOfFolder);
            command.Parameters.AddWithValue("@DataOfEntryType", DataOfEntryType);
            command.Parameters.AddWithValue("@DataOfTimeGenerated", DataOfTimeGenerated);
            command.Parameters.AddWithValue("@DataOfSource", DataOfSource);
            command.Parameters.AddWithValue("@DataOfMessage", DataOfMessage);
            connection.Open();
            command.ExecuteNonQuery();
            connection.Close();
        }
        private static void WriteIntoDataBaseSystem(string DataOfMachine, string DataOfFolder, string DataOfEntryType,
            string DataOfTimeGenerated, string DataOfSource, string DataOfMessage)
        {
            SQLiteConnection connection = new SQLiteConnection(string.Format("Data Source={0};", databaseName));
            SQLiteCommand command = new SQLiteCommand("INSERT INTO LogSystem (MachineName, FolderName, EntryType, TimeGenerated, " +
                "Source, MessageText) VALUES (@DataOfMachine, @DataOfFolder, @DataOfEntryType, @DataOfTimeGenerated, " +
                "@DataOfSource, @DataOfMessage);", connection);
            command.Parameters.AddWithValue("@DataOfMachine", DataOfMachine);
            command.Parameters.AddWithValue("@DataOfFolder", DataOfFolder);
            command.Parameters.AddWithValue("@DataOfEntryType", DataOfEntryType);
            command.Parameters.AddWithValue("@DataOfTimeGenerated", DataOfTimeGenerated);
            command.Parameters.AddWithValue("@DataOfSource", DataOfSource);
            command.Parameters.AddWithValue("@DataOfMessage", DataOfMessage);
            connection.Open();
            command.ExecuteNonQuery();
            connection.Close();
        }
        private static void Processing(string Treatment)
        {
            string[] Worlds = Treatment.Split(new char[] {'@'});
            string KeyCodeForCheck = Worlds[0];
            string MachineNameS = Worlds[1];
            string LogS = Worlds[2];
            string EntryTypeS = Worlds[3];
            string TimeGeneratedS = Worlds[4];
            string SourceS = Worlds[5];
            string MessageS = Worlds[6];
            Console.WriteLine("Получено: ", KeyCodeForCheck, MachineNameS, LogS, EntryTypeS, TimeGeneratedS, SourceS, MessageS);
            if (KeyCodeForCheck.Contains(KeyCodeForCheck))
            {
                if (LogS == "Application")
                {
                    WriteIntoDataBaseApplication(MachineNameS, LogS, EntryTypeS, TimeGeneratedS, SourceS, MessageS);
                }
                if (LogS == "Security")
                {
                    WriteIntoDataBaseSecurity(MachineNameS, LogS, EntryTypeS, TimeGeneratedS, SourceS, MessageS);
                }
                if (LogS == "System")
                {
                    WriteIntoDataBaseSystem(MachineNameS, LogS, EntryTypeS, TimeGeneratedS, SourceS, MessageS);
                }
            }
        }

        static void GetLogDataText()
        {
            IPHostEntry GetDNS = Dns.GetHostEntry("localhost");
            IPAddress GetIpAddress = GetDNS.AddressList[0];
            IPEndPoint CreateIPEndPoint = new IPEndPoint(GetIpAddress, 11000);
            Socket Transducer = new Socket(GetIpAddress.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
            try
            {
                Transducer.Bind(CreateIPEndPoint);
                Transducer.Listen(10);
                while (true)
                {
                    Socket Receiver = Transducer.Accept();
                    string data = null;
                    byte[] buffer = new byte[1024];
                    int bytesRec = Receiver.Receive(buffer);
                    data += Encoding.UTF8.GetString(buffer, 0, bytesRec);
                    Processing(data);
                    string reply = "ok";
                    byte[] LogTextMessage = Encoding.UTF8.GetBytes(reply);
                    Receiver.Send(LogTextMessage);
                    Receiver.Shutdown(SocketShutdown.Both);
                    Receiver.Close();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
            }
        }
        static void Main(string[] args)
        {
            FirstRunDB();
            GetLogDataText();
        }
    }
}
