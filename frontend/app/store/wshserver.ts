// Copyright 2024, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

// generated by cmd/generate/main-generate.go

import * as WOS from "./wos";

// WshServerCommandToDeclMap
class WshServerType {
    // command "authenticate" [call]
	AuthenticateCommand(data: string, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("authenticate", data, opts);
    }

    // command "controllerinput" [call]
	ControllerInputCommand(data: CommandBlockInputData, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("controllerinput", data, opts);
    }

    // command "controllerrestart" [call]
	ControllerRestartCommand(data: CommandBlockRestartData, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("controllerrestart", data, opts);
    }

    // command "createblock" [call]
	CreateBlockCommand(data: CommandCreateBlockData, opts?: RpcOpts): Promise<ORef> {
        return WOS.wshServerRpcHelper_call("createblock", data, opts);
    }

    // command "deleteblock" [call]
	DeleteBlockCommand(data: CommandDeleteBlockData, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("deleteblock", data, opts);
    }

    // command "eventpublish" [call]
	EventPublishCommand(data: WaveEvent, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("eventpublish", data, opts);
    }

    // command "eventrecv" [call]
	EventRecvCommand(data: WaveEvent, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("eventrecv", data, opts);
    }

    // command "eventsub" [call]
	EventSubCommand(data: SubscriptionRequest, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("eventsub", data, opts);
    }

    // command "eventunsub" [call]
	EventUnsubCommand(data: SubscriptionRequest, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("eventunsub", data, opts);
    }

    // command "eventunsuball" [call]
	EventUnsubAllCommand(opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("eventunsuball", null, opts);
    }

    // command "fileappend" [call]
	FileAppendCommand(data: CommandFileData, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("fileappend", data, opts);
    }

    // command "fileappendijson" [call]
	FileAppendIJsonCommand(data: CommandAppendIJsonData, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("fileappendijson", data, opts);
    }

    // command "fileread" [call]
	FileReadCommand(data: CommandFileData, opts?: RpcOpts): Promise<string> {
        return WOS.wshServerRpcHelper_call("fileread", data, opts);
    }

    // command "filewrite" [call]
	FileWriteCommand(data: CommandFileData, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("filewrite", data, opts);
    }

    // command "getmeta" [call]
	GetMetaCommand(data: CommandGetMetaData, opts?: RpcOpts): Promise<MetaType> {
        return WOS.wshServerRpcHelper_call("getmeta", data, opts);
    }

    // command "message" [call]
	MessageCommand(data: CommandMessageData, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("message", data, opts);
    }

    // command "remotefileinfo" [call]
	RemoteFileInfoCommand(data: string, opts?: RpcOpts): Promise<FileInfo> {
        return WOS.wshServerRpcHelper_call("remotefileinfo", data, opts);
    }

    // command "remotestreamfile" [responsestream]
	RemoteStreamFileCommand(data: CommandRemoteStreamFileData, opts?: RpcOpts): AsyncGenerator<CommandRemoteStreamFileRtnData, void, boolean> {
        return WOS.wshServerRpcHelper_responsestream("remotestreamfile", data, opts);
    }

    // command "resolveids" [call]
	ResolveIdsCommand(data: CommandResolveIdsData, opts?: RpcOpts): Promise<CommandResolveIdsRtnData> {
        return WOS.wshServerRpcHelper_call("resolveids", data, opts);
    }

    // command "setmeta" [call]
	SetMetaCommand(data: CommandSetMetaData, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("setmeta", data, opts);
    }

    // command "setview" [call]
	SetViewCommand(data: CommandBlockSetViewData, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("setview", data, opts);
    }

    // command "streamcpudata" [responsestream]
	StreamCpuDataCommand(data: CpuDataRequest, opts?: RpcOpts): AsyncGenerator<CpuDataType, void, boolean> {
        return WOS.wshServerRpcHelper_responsestream("streamcpudata", data, opts);
    }

    // command "streamtest" [responsestream]
	StreamTestCommand(opts?: RpcOpts): AsyncGenerator<number, void, boolean> {
        return WOS.wshServerRpcHelper_responsestream("streamtest", null, opts);
    }

    // command "streamwaveai" [responsestream]
	StreamWaveAiCommand(data: OpenAiStreamRequest, opts?: RpcOpts): AsyncGenerator<OpenAIPacketType, void, boolean> {
        return WOS.wshServerRpcHelper_responsestream("streamwaveai", data, opts);
    }

    // command "test" [call]
	TestCommand(data: string, opts?: RpcOpts): Promise<void> {
        return WOS.wshServerRpcHelper_call("test", data, opts);
    }

}

export const WshServer = new WshServerType();
