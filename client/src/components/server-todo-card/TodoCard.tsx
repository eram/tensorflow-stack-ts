import * as React from "react";
import { Card, Table, Button, Modal, Input } from "antd";
import * as Model from "./TodoCardModel";
import { ClientWrapper } from "../../utils";
import "./TodoCard.less";

const { Column } = Table;

interface IProps {
    title: string;
    client?: ClientWrapper;
    model?: Model.TodoCardModel;
}

export class TodoCard extends React.Component<IProps, Model.ICompState> {

    constructor(props: IProps) {
        super(props);
        const model = this.props.model || new Model.TodoCardModel(this, this.props.client);
        this.state = model.init();
        this.onOk = this.onOk.bind(this);
        this.onCancel = this.onCancel.bind(this);
    }

    componentWillUnmount(): void {
        this.state.model.unmount();
    }

    render(): JSX.Element {
        return (
            <div>
                <Card bordered title="Todo List">
                    <Button type="primary" icon="plus"
                        onClick={() => { this.setState({ modalVisible: true }); }}>New Task</Button>
                    <Table dataSource={this.state.todoItems}>
                        <Column title="Id" dataIndex="id" key="id"></Column>
                        <Column title="Task" dataIndex="name" key="name"></Column>
                        <Column title="Status" dataIndex="isCompleted" key="isCompleted"
                            // tslint:disable-next-line:no-any
                            render={(text: any, record: Model.ITodoItem, index: number) => {
                                return <span>{record.isCompleted ? "Completed" : "Pending"}</span>;
                            }}></Column>
                        <Column title="Action" key="action"
                            // tslint:disable-next-line:no-any
                            render={(text: any, todo: Model.ITodoItem, index: number) => (
                                <Button type={todo.isCompleted ? "ghost" : "primary"}
                                    onClick={() => {
                                        this.state.model.toggleTodo(todo.id);
                                    }}>{todo.isCompleted ? "Reopen" : "Complete"}</Button>
                            )} />
                    </Table>
                </Card>
                <Modal title="New Task" visible={this.state.modalVisible}
                    onOk={() => this.onOk()}
                    onCancel={() => this.onCancel()}>
                    <Input.TextArea placeholder="Input the name of the task" rows={4}
                        onChange={(e) => {
                            this.setState({ newTaskName: e.target.value });
                        }} />
                </Modal>
            </div>
        );
    }

    private onOk() {
        const todo: Model.ITodoItem = {
            id: 0,
            key: 0,
            name: this.state.newTaskName,
            isCompleted: false,
        };
        this.state.model.addTodo(todo);
        this.setState({ modalVisible: false });
    }

    private onCancel() {
        this.setState({ modalVisible: false });
    }
}
