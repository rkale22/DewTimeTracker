import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, InputNumber, Row, Col, message } from 'antd';
// import moment, { Moment } from 'moment'; // Removed unused import
import { createTimesheet } from '../services/timesheetService';
import { useAuth } from '../utils/AuthContext';

const days = ['mon', 'tue', 'wed', 'thu', 'fri'];

interface TimesheetFormProps {
  onSuccess?: () => void;
}

const TimesheetForm: React.FC<TimesheetFormProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const validateMonday = (_: any, value: any) => {
    if (!value) return Promise.reject('Please select a week start date');
    if (value.isoWeekday && value.isoWeekday() !== 1) return Promise.reject('Week start must be a Monday');
    return Promise.resolve();
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const hours: Record<string, number> = {};
      days.forEach(day => {
        hours[day] = values[day] || 0;
      });
      const data = {
        week_start: values.week_start.format('YYYY-MM-DD'),
        hours,
        manager_email: values.manager_email,
        comment: values.comment,
        project: values.project,
      };
      await createTimesheet(data, token!);
      message.success('Timesheet created successfully!');
      form.resetFields();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to create timesheet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        [days[0]]: 8,
        [days[1]]: 8,
        [days[2]]: 8,
        [days[3]]: 8,
        [days[4]]: 8,
      }}
    >
      <Form.Item
        label="Week Start (Monday)"
        name="week_start"
        rules={[{ required: true, validator: validateMonday }]}
      >
        <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
      </Form.Item>
      <Row gutter={8}>
        {days.map(day => (
          <Col span={4} key={day}>
            <Form.Item
              label={day.charAt(0).toUpperCase() + day.slice(1)}
              name={day}
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} max={24} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        ))}
      </Row>
      <Form.Item
        label="Manager Email"
        name="manager_email"
        rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="Project" name="project">
        <Input />
      </Form.Item>
      <Form.Item label="Comment" name="comment">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Create Timesheet
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TimesheetForm; 