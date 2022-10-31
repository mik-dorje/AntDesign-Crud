import "./App.css";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  SearchOutlined,
  QuestionCircleOutlined,
  PlusCircleFilled,
} from "@ant-design/icons";
import { createLanguageService } from "typescript";
import { table } from "console";

interface DataType {
  key: string;
  id: number | null;
  name: string;
  address: any;
}

const originData: DataType[] = [
  {
    key: "",
    id: null,
    name: "",
    address: "",
  },
];

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: "number" | "text";
  record: DataType;
  index: number;
  children: React.ReactNode;
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode =
    inputType === "number" ? (
      <InputNumber style={{ width: "90%" }} />
    ) : (
      <Input style={{ width: "90%" }} />
    );

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const App: React.FC = () => {
  const [form] = Form.useForm();
  const [formModal] = Form.useForm();
  const [data, setData] = useState<DataType[]>(originData);
  const [editingKey, setEditingKey] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [typedWord, setTypedWord] = useState<any>(null);
  const [tableData, setTableData] = useState<any>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const isEditing = (record: DataType) => record.key === editingKey;

  const fetchData = async () => {
    const result = await axios("https://jsonplaceholder.typicode.com/users");
    // const data = result.data.map(({ username, email, phone, website, company, ...rest }) => rest);
    const data = result.data.map((object: DataType) => {
      return {
        key: object?.id?.toString(),
        id: object.id,
        name: object.name,
        // address: `${object.address.city}`,
        address: `${object.address.city}, ${object.address.street}`,
      };
    });
    setData(data);
  };

  useEffect(() => {
    fetchData();
    console.log("First data fetch");
  }, []);

  useEffect(() => {
    setTableData(data);
    // console.log({ typedWord, data });
    if (typedWord) {
      const resultArray = data?.filter(
        (user) =>
          user?.id?.toString().includes(typedWord) ||
          user?.address?.includes(typedWord) ||
          user?.name?.includes(typedWord) ||
          user?.address?.toLowerCase().includes(typedWord) ||
          user?.name?.toLowerCase().includes(typedWord)
      );
      setTableData(resultArray);
    }
    setLoaded(true);
  }, [typedWord, data]);

  const edit = (record: Partial<DataType> & { key: React.Key }) => {
    form.setFieldsValue({ id: "", name: "", address: "", ...record });
    setEditingKey(record.key);
  };

  const handleDelete = (key: React.Key) => {
    const newData = data.filter((item) => item.key !== key);
    setData(newData);
  };

  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as DataType;

      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        setData(newData);
        setEditingKey("");
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const cancel = () => {
    setEditingKey("");
  };

  const onFinish = (values: any) => {
    // console.log(values);
    setData([
      ...data,
      {
        key: values.id ? values.id : data.length + 1,
        id: values.id ? values.id : data.length + 1,
        name: `${values.firstname} ${values.lastname}`,
        address: values.address,
      },
    ]);
    formModal.resetFields();
    setModalOpen(false);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: "15%",
      editable: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      width: "20%",
      editable: true,
    },
    {
      title: "Address",
      dataIndex: "address",
      width: "20%",
      editable: true,
    },
    {
      title: "Action",
      dataIndex: "operation",
      width: "20%",
      render: (_: any, record: DataType) => {
        const editable = isEditing(record);
        console.log({ editable });
        return editable ? (
          <Space size="middle">
            <Button
              type="primary"
              onClick={() => save(record.key)}
              style={{
                backgroundColor: " #38375f",
                border: "none",
                width: "75px",
              }}
              className="btns"
            >
              Update
            </Button>

            <Button
              type="primary"
              onClick={cancel}
              style={{
                backgroundColor: "#2c5a73",
                border: "none",
                width: "75px",
              }}
              className="btns"
            >
              Back
            </Button>
          </Space>
        ) : (
          <Space size="middle">
            <Popconfirm
              title="Are you sure to delete this record?"
              icon={<QuestionCircleOutlined style={{ color: "red" }} />}
              onConfirm={() => handleDelete(record.key)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button
                type="primary"
                danger
                style={{ width: "75px" }}
                disabled={editingKey !== ""}
              >
                Delete
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              disabled={editingKey !== ""}
              onClick={() => edit(record)}
              style={{ width: "75px" }}
            >
              Edit
            </Button>
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        inputType: col.dataIndex === "id" ? "number" : "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <div className="App">
      <div className="main-page">
        <Modal
          title="New User"
          centered
          visible={modalOpen}
          onOk={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
          okButtonProps={{ hidden: true }}
          cancelButtonProps={{ hidden: true }}
          style={{ boxShadow: "0 0 8px 2px #e5e1e0" }}
          width={600}
        >
          <Form
            form={formModal}
            name="basic"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 14 }}
            initialValues={{ remember: false }}
            onFinish={onFinish}
            // onFinishFailed={onFinishFailed}
            // autoComplete="off"
            // style={{background: "green"}}
          >
            <Form.Item
              label="ID"
              name="id"
              rules={[{ required: false, message: "Please input your Id!" }]}
            >
              <Input type="number" />
            </Form.Item>
            <Form.Item
              label="Firstname"
              name="firstname"
              rules={[
                { required: true, message: "Please input your firstname!" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Lastname"
              name="lastname"
              rules={[
                { required: true, message: "Please input your lastname!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Address"
              name="address"
              rules={[
                { required: true, message: "Please input your address!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Row>
              <Col xs={{ offset: 9 }}>
                <Space size="middle">
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Add
                    </Button>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" danger onClick={handleModalCancel}>
                      Cancel
                    </Button>
                  </Form.Item>
                </Space>
              </Col>
            </Row>
          </Form>
        </Modal>

        <Form form={form} component={false} initialValues={{ remember: false }}>
          <Row justify="space-evenly">
            <Col span={12}>
              <Form.Item>
                <Button
                  type="primary"
                  icon={
                    <PlusCircleFilled
                      style={{ fontSize: "18px", marginRight: "5px" }}
                    />
                  }
                  onClick={() => setModalOpen(true)}
                >
                  <Typography.Text strong style={{ color: "white" }}>
                    Add User
                  </Typography.Text>
                </Button>
              </Form.Item>
            </Col>
            <Col sm={{ span: 8, offset: 4 }} md={{ span: 6, offset: 6 }}>
              <Space size="small" direction="horizontal">
                <Form.Item name="search">
                  <Input
                    prefix={<SearchOutlined className="site-form-item-icon" />}
                    placeholder="Search"
                    onChange={(e) => setTypedWord(e.target.value)}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary">Search</Button>
                </Form.Item>
              </Space>
            </Col>
          </Row>

          {!loaded ? (
            <div className="loader-box">
              <span className="loader"></span>
            </div>
          ) : (
            <Table
              className="main-table"
              components={{
                body: {
                  cell: EditableCell,
                },
              }}
              bordered
              dataSource={tableData}
              columns={mergedColumns}
              rowClassName="editable-row"
              pagination={{
                onChange: cancel,
                pageSize: 5,
              }}
            />
          )}
        </Form>
      </div>
    </div>
  );
};

export default App;
