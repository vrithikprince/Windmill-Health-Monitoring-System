from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import pandas as pd
import joblib
from tensorflow.keras.models import load_model
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

app.config['UPLOAD_FOLDER'] = 'uploads'
app.secret_key = 'random_secret_123'  # Needed for session

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ------------------------ Route to Load Home Page ------------------------
@app.route('/')
def home():
    return render_template('index.html')


# ------------------------ Upload Route for Dashboard ------------------------
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file."}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    session['uploaded_file'] = file_path
    return jsonify({"status": "success", "redirect_url": "/dashboard"})


# ------------------------ Dashboard Route ------------------------
@app.route('/dashboard')
def dashboard():
    file_path = session.get('uploaded_file')
    if not file_path or not os.path.exists(file_path):
        return "No uploaded file found. Please upload again from homepage.", 404

    df = pd.read_excel(file_path)

    if 'TIMESTAMP' in df.columns:
        df['TIMESTAMP'] = pd.to_datetime(df['TIMESTAMP'], errors='coerce')
        df = df.dropna(subset=['TIMESTAMP'])

    selected_features = [
        'AI_GEARBOX_OILPRESSURE', 'AI_DFIG_SPEEDGENERATOR_ENCODER', 'AI_GENERATORSPEED',
        'TEMP_PITCH_FC2_MOTOR', 'AI_BENDING_B1_TE', 'AI_BENDING_B2_TE', 'AI_BENDING_B3_TE',
        'AI_BENDING_B1_PRESSURESIDE', 'AI_BENDING_B2_PRESSURESIDE', 'TEMP_PITCH_FC2_MOTORBRAKE',
        'TEMP_PITCH_FC1_MOTORBRAKE', 'AI_DFIG_ACTIVEPOWER_LSC'
    ]

    target_columns = [
        'TEMP_GEARBOX_IMS_NDE', 'TEMP_GEARBOX_HSS_NDE',
        'TEMP_GEARBOX_HSS_DE', 'TEMP_GEARBOX_OILSUMP', 'TEMP_GEARBOX_IMS_DE'
    ]

    features = [col for col in selected_features if col in df.columns]
    targets = [col for col in target_columns if col in df.columns]

    df_feat = df[features]
    df_tgt = df[targets]

    desc_feats = df_feat.describe().round(2).T.reset_index().rename(columns={'index': 'Column'})
    desc_tgts = df_tgt.describe().round(2).T.reset_index().rename(columns={'index': 'Column'})

    features_stats = desc_feats.to_dict(orient='records')
    targets_stats = desc_tgts.to_dict(orient='records')
    features_means = df_feat.mean().round(2).to_dict()
    targets_means = df_tgt.mean().round(2).to_dict()

    # ✅ Include TIMESTAMP in chart_data
    columns_for_chart = ['TIMESTAMP'] + features + targets
    chart_data = df[columns_for_chart].to_dict(orient='list')

    return render_template('dashboard.j2',
                           features_list=features,
                           targets_list=targets,
                           features_stats=features_stats,
                           targets_stats=targets_stats,
                           features_means=features_means,
                           targets_means=targets_means,
                           chart_data=chart_data)


# ------------------------ Prediction Endpoint (Existing) ------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        df = pd.DataFrame(data['data'])

        if 'ASSETID' not in df.columns:
            return jsonify({"status": "error", "message": "ASSETID column missing in uploaded file."})

        asset_id = str(df['ASSETID'].iloc[0])

        model_path = f'models/model_{asset_id}.keras'
        x_scaler_path = f'scalers/X_scaler_{asset_id}.pkl'
        y_scaler_path = f'scalers/y_scaler_{asset_id}.pkl'

        if not os.path.exists(model_path) or not os.path.exists(x_scaler_path) or not os.path.exists(y_scaler_path):
            return jsonify({"status": "error", "message": "This asset is not available yet - please wait for future updates."})

        model = load_model(model_path)
        x_scaler = joblib.load(x_scaler_path)
        y_scaler = joblib.load(y_scaler_path)

        selected_features = [
            'AI_GEARBOX_OILPRESSURE', 'AI_DFIG_SPEEDGENERATOR_ENCODER', 'AI_GENERATORSPEED',
            'TEMP_PITCH_FC2_MOTOR', 'AI_BENDING_B1_TE', 'AI_BENDING_B2_TE', 'AI_BENDING_B3_TE',
            'AI_BENDING_B1_PRESSURESIDE', 'AI_BENDING_B2_PRESSURESIDE', 'TEMP_PITCH_FC2_MOTORBRAKE',
            'TEMP_PITCH_FC1_MOTORBRAKE', 'AI_DFIG_ACTIVEPOWER_LSC'
        ]

        missing = [col for col in selected_features if col not in df.columns]
        if missing:
            return jsonify({"status": "error", "message": f"Missing required input columns: {', '.join(missing)}"})

        X = df[selected_features]
        X_scaled = x_scaler.transform(X)
        y_pred_scaled = model.predict(X_scaled)
        y_pred = y_scaler.inverse_transform(y_pred_scaled)

        target_columns = [
            'TEMP_GEARBOX_IMS_NDE',
            'TEMP_GEARBOX_HSS_NDE',
            'TEMP_GEARBOX_HSS_DE',
            'TEMP_GEARBOX_OILSUMP',
            'TEMP_GEARBOX_IMS_DE'
        ]

        predictions = []
        metrics = {}

        for i, col in enumerate(target_columns):
            df[f'Predicted_{col}'] = y_pred[:, i]
            df[f'Actual_{col}'] = df[col]
            df[f'Deviation_{col}'] = df[f'Predicted_{col}'] - df[f'Actual_{col}']

            actual = df[col].values
            pred = y_pred[:, i]

            r2 = r2_score(actual, pred)
            mse = mean_squared_error(actual, pred)
            rmse = mse ** 0.5
            mae = mean_absolute_error(actual, pred)

            metrics[col] = {
                "r2": round(r2, 4),
                "mse": round(mse, 4),
                "rmse": round(rmse, 4),
                "mae": round(mae, 4)
            }

        display_cols = []
        for col in target_columns:
            display_cols.extend([f'Actual_{col}', f'Predicted_{col}', f'Deviation_{col}'])

        for _, row in df.iterrows():
            predictions.append({
                "Timestamp": row.get("TIMESTAMP", ""),
                **{col: row[col] for col in selected_features if col in row},  # ✅ Include features
                **{col: row[col] for col in display_cols if col in row}         # Keep target cols
                })

        return jsonify({
            "status": "success",
            "asset_id": asset_id,
            "target_metrics": metrics,
            "results": predictions
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


# ------------------------ Run Flask App ------------------------
if __name__ == '__main__':
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
